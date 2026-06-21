import { writable, get } from 'svelte/store'
import { supabase } from './supabase'
import { getAllData, putTripItem, queueTripItemUpdate } from './idb'
import { sync } from './sync'
import type { Template, TemplateItem, Trip, TripItem } from './idb'

export type SyncStatus = 'loading' | 'ready' | 'offline-empty' | 'error'

export const syncStatus = writable<SyncStatus>('loading')
export const templates = writable<Template[]>([])
export const templateItems = writable<TemplateItem[]>([])
export const trips = writable<Trip[]>([])
export const tripItems = writable<TripItem[]>([])

export async function initStores(): Promise<void> {
	const data = await getAllData()

	templates.set(data.templates)
	templateItems.set(data.template_items)
	trips.set(data.trips)
	tripItems.set(data.trip_items)

	const hasData = data.templates.length > 0 || data.trips.length > 0

	if (hasData) {
		syncStatus.set('ready')
	} else if (!navigator.onLine) {
		syncStatus.set('offline-empty')
	} else {
		syncStatus.set('error')
	}
}

export async function syncAndRefresh(): Promise<void> {
	syncStatus.set('loading')
	await sync()
	await initStores()
}

export async function setTripItemChecked(tripItemId: string, checked: boolean): Promise<void> {
	// 1. Update store immediately (optimistic)
	tripItems.update((items) => items.map((item) => (item.id === tripItemId ? { ...item, checked } : item)))

	// 2. Write to IDB
	const item = get(tripItems).find((i) => i.id === tripItemId)
	if (item) await putTripItem(item)

	// 3. If online: fire-and-forget to Supabase
	// 4. If offline: queue the mutation (overwrites any existing entry for this item)
	if (navigator.onLine) {
		supabase
			.from('trip_items')
			.update({ checked })
			.eq('id', tripItemId)
			.then(({ error }) => {
				if (error) console.error('Failed to sync trip item:', error)
			})
	} else {
		await queueTripItemUpdate(tripItemId, checked)
	}
}
