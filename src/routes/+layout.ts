import { redirect } from '@sveltejs/kit'
import { supabase } from '$lib/supabase'
import type { LayoutLoad } from './$types'

export const ssr = false

export const load: LayoutLoad = async ({ url }) => {
	const { data: { session } } = await supabase.auth.getSession()

	if (!session && url.pathname !== '/auth') redirect(303, '/auth')
	if (session && url.pathname === '/auth') redirect(303, '/')

	return { session }
}
