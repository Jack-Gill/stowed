# Stowed — Implementation Plan

See `CONTEXT.md` for domain language and `docs/adr/` for key architectural decisions.

## Status

| Phase | Description | Status |
|---|---|---|
| 1 | Project scaffold, PWA shell, CI/CD deploy | ✅ Done |
| 2 | Database schema + RLS | ✅ Done |
| 3 | Authentication (Email OTP) | ✅ Done |
| 4 | Local data layer (IndexedDB + offline queue + sync) | ⬜ Next |
| 5 | Core UI | ⬜ |
| 6 | PWA polish | ⬜ |

## Phase 2 — Database Schema

Schema, RLS policies, `updated_at` trigger, and seed data are in `supabase/migrations/`. Applied via `supabase db push`. TypeScript types generated to `src/lib/db.types.ts`.

## Phase 3 — Authentication (Email OTP)

1. In Supabase Dashboard → Authentication → SMTP Settings: configure Resend as Custom SMTP
   - Host: `smtp.resend.com`, Port: `465`, User: `resend`, Password: your Resend API key
2. In Authentication → Email Templates: verify OTP template looks sensible
3. In Authentication → Providers → Email: disable "Confirm email" magic link, ensure OTP is enabled
4. Add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to `.env.local`; add as GitHub Actions secrets and inject them as env vars on the `npm run build` step in `deploy.yml`
5. Build a single `/auth` route: email-input step → OTP-input step (Svelte state, not separate routes); on success, `onAuthStateChange` → `invalidateAll()` → root layout redirects to `/`
6. Root layout: `ssr = false`, `getSession()` in load function with pathname-based redirect guards, `onAuthStateChange` + `invalidateAll()` in `onMount` (see ADR-0008)

## Phase 4 — Local Data Layer

Architecture: IndexedDB (via `idb`) mirrors Supabase tables. All UI reads from IndexedDB. Writes go to IndexedDB immediately (optimistic) and are either sent to Supabase directly (online) or queued (offline).

### IndexedDB schema

```
db: 'stowed'
stores:
  templates      — mirrors templates + template_items (denormalised for read speed)
  trips          — mirrors trips
  trip_items     — mirrors trip_items
  offline_queue  — { id, operation, entity_type, entity_id, payload, timestamp }
```

### Sync service (`src/lib/sync.ts`)

- `pull()` — fetch all user data from Supabase, overwrite IndexedDB
- `flushQueue()` — apply queued mutations to Supabase in timestamp order (last-write-wins)
- `sync()` — `flushQueue()` then `pull()`

Triggers: app init (if `navigator.onLine`), `window online` event, manual refresh button.

### Optimistic UI

TripItem checked state lives in a Svelte store fed from IndexedDB. On check/uncheck:
1. Update store immediately
2. Write to IndexedDB
3. If online: fire Supabase update (fire-and-forget)
4. If offline: write to `offline_queue` instead

## Phase 5 — Core UI

Build in this order (each delivers user value independently):

1. **Trip list** — home screen, sorted by `created_at` desc, tap to open
2. **Trip detail** — packing checklist, optimistic check/uncheck, progress indicator
3. **Template list** — system + user templates
4. **Template detail / editor** — add/remove/reorder items, LibraryItem autocomplete
5. **New trip flow** — pick template → name trip → create (copies template items as snapshot)
6. **Sync status bar** — last synced timestamp, manual refresh button, offline indicator
7. **Account** — sign out

## Phase 6 — PWA Polish

- Replace placeholder `pwa-icon.svg` with proper icons (192×192 and 512×512 PNG)
- Test install prompt on mobile Chrome and Safari (Safari requires `apple-touch-icon`)
- Offline banner: watch `navigator.onLine`, surface to user when offline
- Verify service worker caches app shell correctly on first install
- Test cold-start offline: install on device, enable airplane mode, reopen app
