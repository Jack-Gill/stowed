# Stowed

A progressive web app for building reusable packing lists and tracking what you've packed for specific trips.

## Language

**Template**:
A named, reusable packing list. Owned by either the system (bundled defaults) or a User (custom-created). Ownership is the only structural distinction — same schema, same UI.
_Avoid_: Packing template, list template, preset

**Trip**:
A specific packing instance created from a Template at a point in time. Fully independent of its source Template after creation — changes to the Template do not propagate to existing Trips.
_Avoid_: Packing list, trip instance

**TripItem**:
A single item within a Trip. Has a name (copied from the TemplateItem at Trip creation) and a checked/unchecked state representing whether it has been packed.
_Avoid_: Packing item, checklist item

**TemplateItem**:
A single item within a Template. Has a name string only — no category, no checked state.
_Avoid_: Template entry

**LibraryItem**:
A suggested item name in the global catalog, used to power autocomplete when adding items to Templates. Not linked to TemplateItems or TripItems by foreign key — it is a suggestion list, not a source of truth.
_Avoid_: Global item, item library entry

## Example dialogue

> "I want to add 'Passport' to my Weekend Away template."
> — The user is adding a **TemplateItem** named "Passport" to a **Template**. The **LibraryItem** "Passport" appears as an autocomplete suggestion but is not referenced by the resulting TemplateItem.

> "I just packed my charger — I'll check it off."
> — The user is setting the checked state on a **TripItem** within an active **Trip**.

> "My 2 Weeks Abroad template now has a 'Travel Insurance' item — will my Italy trip update?"
> — No. **Italy trip** is a **Trip** — a snapshot taken when it was created. Adding a **TemplateItem** to its source **Template** has no effect on it.

## Local development notes

**Supabase migrations must include explicit grants.** Supabase cloud adds table privileges automatically; local migrations do not. Any migration that creates tables needs `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role` (plus sequences and routines). Without this, REST API calls return 403 even for authenticated users. After changing a migration, run `npx supabase db reset`.
