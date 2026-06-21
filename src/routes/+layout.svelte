<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	let { children } = $props();

	onMount(() => {
		const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
			invalidateAll()
		})
		return () => subscription.unsubscribe()
	})
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
