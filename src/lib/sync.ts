import { supabase } from './supabase'
import { replaceAll, getOfflineQueue, clearOfflineQueue } from './idb'

export async function flushQueue(): Promise<void> {
	const queue = await getOfflineQueue()
	if (queue.length === 0) return

	for (const entry of queue) {
		const { error } = await supabase
			.from('trip_items')
			.update({ checked: entry.checked })
			.eq('id', entry.trip_item_id)
		if (error) throw error
	}

	await clearOfflineQueue()
}

export async function pull(): Promise<void> {
	const [
		{ data: templates, error: e1 },
		{ data: template_items, error: e2 },
		{ data: trips, error: e3 },
		{ data: trip_items, error: e4 }
	] = await Promise.all([
		supabase.from('templates').select('*'),
		supabase.from('template_items').select('*'),
		supabase.from('trips').select('*'),
		supabase.from('trip_items').select('*')
	])

	const error = e1 ?? e2 ?? e3 ?? e4
	if (error) throw error

	await replaceAll({
		templates: templates!,
		template_items: template_items!,
		trips: trips!,
		trip_items: trip_items!
	})
}

export async function sync(): Promise<void> {
	try {
		await flushQueue()
		await pull()
	} catch {
		// Leave IDB intact; will retry on next sync trigger
	}
}
