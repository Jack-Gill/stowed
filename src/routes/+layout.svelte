<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { syncStatus, initStores, syncAndRefresh } from '$lib/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	onMount(() => {
		function handleOnline() {
			syncAndRefresh()
		}
		window.addEventListener('online', handleOnline)

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'INITIAL_SESSION' && session) {
				// Session is restored and token is fresh by the time this fires
				if (navigator.onLine) syncAndRefresh()
				else initStores()
			} else if (event === 'SIGNED_IN') {
				syncAndRefresh()
			}
			invalidateAll()
		})

		return () => {
			subscription.unsubscribe()
			window.removeEventListener('online', handleOnline)
		}
	})
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !data.session || $syncStatus === 'ready'}
	{@render children()}
{:else if $syncStatus === 'loading'}
	<div class="flex h-screen items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600"></div>
	</div>
{:else if $syncStatus === 'offline-empty'}
	<div class="flex h-screen flex-col items-center justify-center gap-2 px-6 text-center">
		<p class="text-base font-medium text-gray-900">You're offline</p>
		<p class="text-sm text-gray-500">Connect to the internet to load your data</p>
	</div>
{:else}
	<div class="flex h-screen flex-col items-center justify-center gap-2 px-6 text-center">
		<p class="text-base font-medium text-gray-900">Something went wrong</p>
		<p class="text-sm text-gray-500">Reload the page to try again</p>
	</div>
{/if}
