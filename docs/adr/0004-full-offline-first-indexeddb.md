# Full offline-first data layer via IndexedDB

The app must be fully functional from a cold start with no network connection — the primary use case is packing during travel where connectivity is unreliable. This requires persisting the user's full data set (trips, templates, items) to IndexedDB on the device, not just queuing mutations.

A mutation-queue-only approach (where data loads from Supabase on open) was rejected because it fails the cold-start requirement: a user who boards a flight without pre-loading data would see an empty app.

IndexedDB is used over localStorage because localStorage's 5MB cap is insufficient for a full data cache.
