# Trips are independent snapshots of their source Template

When a Trip is created from a Template, its items are copied by value. The Trip stores `source_template_id` for display purposes but is structurally decoupled — updates to the Template never mutate existing Trips.

This is intentional. A Trip is an in-progress packing checklist. Silently adding or removing items from an active Trip would be disorienting mid-pack. Predictability of the checklist is more valuable than staying current with the Template.
