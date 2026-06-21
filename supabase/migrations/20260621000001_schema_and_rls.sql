create table library_items (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_type text not null check (owner_type in ('system', 'user')),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_owner_has_id check (
    (owner_type = 'user' and user_id is not null) or
    (owner_type = 'system' and user_id is null)
  )
);

create table template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  name text not null,
  position integer not null default 0
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source_template_id uuid references templates(id) on delete set null,
  created_at timestamptz not null default now()
);

create table trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  checked boolean not null default false,
  updated_at timestamptz not null default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trip_items_updated_at
  before update on trip_items
  for each row execute function update_updated_at();

-- RLS

alter table library_items enable row level security;
create policy "library_items readable by authenticated"
  on library_items for select to authenticated using (true);

alter table templates enable row level security;
create policy "system templates readable by authenticated"
  on templates for select to authenticated using (owner_type = 'system');
create policy "user templates: owner full access"
  on templates for all to authenticated
  using (owner_type = 'user' and user_id = auth.uid())
  with check (owner_type = 'user' and user_id = auth.uid());

alter table template_items enable row level security;
create policy "template_items readable via template"
  on template_items for select to authenticated
  using (exists (
    select 1 from templates t where t.id = template_id
    and (t.owner_type = 'system' or t.user_id = auth.uid())
  ));
create policy "template_items writable by template owner"
  on template_items for all to authenticated
  using (exists (
    select 1 from templates t where t.id = template_id
    and t.owner_type = 'user' and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from templates t where t.id = template_id
    and t.owner_type = 'user' and t.user_id = auth.uid()
  ));

alter table trips enable row level security;
create policy "trips: owner full access"
  on trips for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table trip_items enable row level security;
create policy "trip_items: owner full access"
  on trip_items for all to authenticated
  using (exists (
    select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()
  ));

-- Grants (Supabase cloud adds these automatically; local migrations need them explicitly)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on routines to anon, authenticated, service_role;
