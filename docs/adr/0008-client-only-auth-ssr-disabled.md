# Client-only auth, SSR disabled

The app disables server-side rendering entirely (`export const ssr = false` in the root layout) and uses the Supabase browser client alone for authentication — no `@supabase/ssr`, no server hooks, no session cookies. Session state is read from localStorage via `supabase.auth.getSession()` in the root `+layout.ts` load function and propagated to the rest of the app via `$page.data`. Auth events (sign-in, sign-out, token refresh) are handled by an `onAuthStateChange` listener in the root layout that calls `invalidateAll()` to re-run load functions.

This trades SSR accuracy (a revoked token isn't caught until the next Supabase call) for offline capability and simplicity. SSR-based auth requires cookies and network access to validate the session on every request, which conflicts with offline-first use. Data access is protected by Supabase RLS regardless, so a stale client-side session only results in empty UI — not a data exposure.

## Considered Options

- `@supabase/ssr` with `hooks.server.ts` — rejected because session validation requires a network call, breaking the offline-first model; also requires cookie plumbing through Cloudflare Workers
- `supabase.auth.getUser()` instead of `getSession()` — rejected for the same reason: network-required, fails offline
