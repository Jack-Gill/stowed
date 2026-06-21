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

Architecture: IndexedDB (via `idb`) mirrors Supabase tables. All UI reads from global Svelte stores populated from IndexedDB. Writes go to IndexedDB immediately (optimistic) and are either sent to Supabase directly (online) or queued (offline). Only TripItem checked-state mutations are queued; other writes (template edits, trip creation) require a live connection.

### Files

- `src/lib/idb.ts` — IDB client, schema, typed helpers
- `src/lib/sync.ts` — `pull()`, `flushQueue()`, `sync()`
- `src/lib/stores.ts` — global stores, `initStores()`, `syncAndRefresh()`, `setTripItemChecked()`

### IndexedDB schema

```
db: 'stowed', version: 1
stores:
  templates       keyPath: 'id'
  template_items  keyPath: 'id',          index: 'template_id'
  trips           keyPath: 'id'
  trip_items      keyPath: 'id',          index: 'trip_id'
  offline_queue   keyPath: 'trip_item_id' ← deduplicates by item; put() overwrites
    fields: trip_item_id, checked (boolean), timestamp
```

### Sync service (`src/lib/sync.ts`)

- `pull()` — fetch all user data from Supabase, clear and repopulate each IDB store (full wipe, handles deletes correctly)
- `flushQueue()` — send each queued checked-state mutation to Supabase; on full success clear the queue; on any failure throw (leaves queue intact, skips `pull()`)
- `sync()` — `flushQueue()` then `pull()`; if flush throws, leave IDB intact so the user keeps their local state

Triggers: `onMount` (if session + `navigator.onLine`), `window online` event, `SIGNED_IN` auth event.

If session exists but offline on mount: call `initStores()` only (no pull).

### Global stores (`src/lib/stores.ts`)

```
syncStatus  — 'loading' | 'ready' | 'offline-empty' | 'error'
trips       — Trip[]
tripItems   — TripItem[]
templates   — Template[]
templateItems — TemplateItem[]
```

`initStores()` reads IDB into stores and sets `syncStatus`: `'ready'` if IDB has data, `'offline-empty'` if empty + offline, `'loading'` if empty + online (sync in progress).

`syncAndRefresh()` — sets `syncStatus = 'loading'`, calls `sync()`, then `initStores()`.

Root layout renders a spinner for `'loading'` and an explicit "offline, no cached data" message for `'offline-empty'`.

### Optimistic UI

`setTripItemChecked(tripItemId, checked)`:
1. Update `tripItems` store immediately
2. Write to IDB `trip_items`
3. If online: fire-and-forget Supabase update
4. If offline: `queueTripItemUpdate(tripItemId, checked)` — overwrites any existing queue entry for this item

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
