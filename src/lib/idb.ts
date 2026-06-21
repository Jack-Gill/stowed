import { openDB, type DBSchema } from 'idb'
import type { Tables } from './db.types'

export type Template = Tables<'templates'>
export type TemplateItem = Tables<'template_items'>
export type Trip = Tables<'trips'>
export type TripItem = Tables<'trip_items'>

export type OfflineQueueEntry = {
	trip_item_id: string
	checked: boolean
	timestamp: number
}

interface StowedDB extends DBSchema {
	templates: { key: string; value: Template }
	template_items: { key: string; value: TemplateItem; indexes: { template_id: string } }
	trips: { key: string; value: Trip }
	trip_items: { key: string; value: TripItem; indexes: { trip_id: string } }
	offline_queue: { key: string; value: OfflineQueueEntry }
}

let dbPromise: ReturnType<typeof openDB<StowedDB>> | null = null

function getDb() {
	if (!dbPromise) {
		dbPromise = openDB<StowedDB>('stowed', 1, {
			upgrade(db) {
				db.createObjectStore('templates', { keyPath: 'id' })
				const templateItems = db.createObjectStore('template_items', { keyPath: 'id' })
				templateItems.createIndex('template_id', 'template_id')
				db.createObjectStore('trips', { keyPath: 'id' })
				const tripItems = db.createObjectStore('trip_items', { keyPath: 'id' })
				tripItems.createIndex('trip_id', 'trip_id')
				db.createObjectStore('offline_queue', { keyPath: 'trip_item_id' })
			}
		})
	}
	return dbPromise
}

export async function replaceAll(data: {
	templates: Template[]
	template_items: TemplateItem[]
	trips: Trip[]
	trip_items: TripItem[]
}): Promise<void> {
	const db = await getDb()
	const tx = db.transaction(['templates', 'template_items', 'trips', 'trip_items'], 'readwrite')
	const ts = tx.objectStore('templates')
	const ti = tx.objectStore('template_items')
	const tr = tx.objectStore('trips')
	const tri = tx.objectStore('trip_items')

	// Queue all operations synchronously so the transaction doesn't auto-commit
	ts.clear()
	ti.clear()
	tr.clear()
	tri.clear()
	for (const row of data.templates) ts.put(row)
	for (const row of data.template_items) ti.put(row)
	for (const row of data.trips) tr.put(row)
	for (const row of data.trip_items) tri.put(row)

	await tx.done
}

export async function getAllData(): Promise<{
	templates: Template[]
	template_items: TemplateItem[]
	trips: Trip[]
	trip_items: TripItem[]
}> {
	const db = await getDb()
	const [templates, template_items, trips, trip_items] = await Promise.all([
		db.getAll('templates'),
		db.getAll('template_items'),
		db.getAll('trips'),
		db.getAll('trip_items')
	])
	return { templates, template_items, trips, trip_items }
}

export async function putTripItem(item: TripItem): Promise<void> {
	const db = await getDb()
	await db.put('trip_items', item)
}

export async function queueTripItemUpdate(tripItemId: string, checked: boolean): Promise<void> {
	const db = await getDb()
	await db.put('offline_queue', { trip_item_id: tripItemId, checked, timestamp: Date.now() })
}

export async function getOfflineQueue(): Promise<OfflineQueueEntry[]> {
	const db = await getDb()
	return db.getAll('offline_queue')
}

export async function clearOfflineQueue(): Promise<void> {
	const db = await getDb()
	await db.clear('offline_queue')
}
