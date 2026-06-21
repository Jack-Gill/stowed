# Sparse integer ordering for TemplateItems and TripItems

Both `template_items` and `trip_items` use a `position integer` column for display order. Gaps are permitted — the app writes all positions on a reorder but makes no effort to close gaps left by deletes.

Fractional indexing (lexicographic strings like "a0", "b0") was the main alternative: it avoids renumbering the full list and handles concurrent edits without conflicts. We chose sparse integers instead because the sync model (ADR-0004, ADR-0005) does a full pull on reconnect, which overwrites IndexedDB entirely — so any offline ordering conflict self-heals on next sync. There is no ordering-specific conflict to solve. Sparse integers are simpler to reason about, query, and debug.

If the sync model ever moves to incremental pulls, ordering conflicts become real and fractional indexing should be revisited.
