<script lang="ts">
	import { supabase } from '$lib/supabase'

	let step = $state<'email' | 'otp'>('email')
	let email = $state('')
	let token = $state('')
	let error = $state('')
	let loading = $state(false)

	async function requestOtp(e: SubmitEvent) {
		e.preventDefault()
		loading = true
		error = ''
		email = email.trim()
		const { error: err } = await supabase.auth.signInWithOtp({ email })
		loading = false
		if (err) {
			error = err.message
		} else {
			step = 'otp'
		}
	}

	async function verifyOtp(e: SubmitEvent) {
		e.preventDefault()
		loading = true
		error = ''
		const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
		loading = false
		if (err) error = err.message
		// on success: onAuthStateChange → invalidateAll() → layout redirects to /
	}

	function back() {
		step = 'email'
		token = ''
		error = ''
	}
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<h1 class="mb-8 text-2xl font-semibold">Stowed</h1>

		{#if step === 'email'}
			<form onsubmit={requestOtp} class="flex flex-col gap-4">
				<label class="flex flex-col gap-1">
					<span class="text-sm">Email</span>
					<input
						type="email"
						bind:value={email}
						required
						autocomplete="email"
						class="rounded border px-3 py-2"
					/>
				</label>
				<button type="submit" disabled={loading} class="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
					{loading ? 'Sending…' : 'Send code'}
				</button>
			</form>
		{:else}
			<form onsubmit={verifyOtp} class="flex flex-col gap-4">
				<p class="text-sm">Enter the code sent to <strong>{email}</strong></p>
				<label class="flex flex-col gap-1">
					<span class="text-sm">Code</span>
					<input
						type="text"
						inputmode="numeric"
						autocomplete="one-time-code"
						bind:value={token}
						required
						class="rounded border px-3 py-2 tracking-widest"
					/>
				</label>
				<button type="submit" disabled={loading} class="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
					{loading ? 'Verifying…' : 'Sign in'}
				</button>
				<button type="button" onclick={back} class="text-sm underline">
					Use a different email
				</button>
			</form>
		{/if}

		{#if error}
			<p class="mt-4 text-sm text-red-600">{error}</p>
		{/if}
	</div>
</div>
