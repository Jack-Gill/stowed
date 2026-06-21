# Offline queue scoped to TripItem checked-state mutations only

The offline queue does not cover all writes — only TripItem checked/unchecked mutations are queued when the app is offline. Template edits and trip creation require a live connection.

**Reason:** Creating a trip requires a Supabase round-trip to obtain the canonical `trip_id`. Supporting that offline would require client-side UUID generation and a reconciliation step when the queue is flushed — meaningful added complexity. Template edits are low-frequency and not the app's core loop. The check/uncheck flow is the heart of the app and the most likely action taken without connectivity (packing at an airport, on a plane). Starting with the narrow scope keeps the sync implementation simple and the correctness surface small.

The queue entry shape is dedicated rather than generic: `{ trip_item_id, checked, timestamp }`. Because the queue is single-purpose there is no dispatch table, and `flushQueue()` is a simple loop over Supabase `.update()` calls.

Deduplication happens on write: a new entry for a `trip_item_id` that is already queued overwrites the existing one (IDB `put()` on a `keyPath: 'trip_item_id'` store). The queue holds at most one entry per item at any time.

If offline coverage for other mutations becomes a felt need, the queue's scope can be extended then — with a clearer picture of the reconciliation requirements.
