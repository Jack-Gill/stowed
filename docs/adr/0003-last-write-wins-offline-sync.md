# Last-write-wins by client timestamp for offline sync conflict resolution

When the same TripItem is mutated on two devices while both are offline, the mutation with the later client timestamp wins on sync. Each queued mutation carries a client-side timestamp for this purpose.

Alternatives considered: server-wins (first sync wins — arbitrary and silent), conflict UI (ask the user to resolve — overkill for a boolean checked state). For a packing checklist, the cost of occasionally wrong state is low and the user can re-tap. Simplicity wins.
