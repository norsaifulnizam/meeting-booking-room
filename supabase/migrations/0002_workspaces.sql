-- Multi-tenant foundation. The demo remains open, but every application query
-- now carries a workspace boundary so tenant-aware RLS can be enabled with auth.
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- A stable workspace keeps the seeded v1 demo working after this migration.
insert into workspaces (id, slug, name) values
  ('c3c3c3c3-0000-0000-0000-000000000001', 'demo-team', 'Demo Team')
on conflict (id) do update set slug = excluded.slug, name = excluded.name;

alter table rooms add column if not exists workspace_id uuid;
alter table bookings add column if not exists workspace_id uuid;

update rooms set workspace_id = 'c3c3c3c3-0000-0000-0000-000000000001' where workspace_id is null;
update bookings set workspace_id = 'c3c3c3c3-0000-0000-0000-000000000001' where workspace_id is null;

alter table rooms alter column workspace_id set not null;
alter table bookings alter column workspace_id set not null;
alter table rooms drop constraint if exists rooms_workspace_id_fkey;
alter table bookings drop constraint if exists bookings_workspace_id_fkey;
alter table rooms add constraint rooms_workspace_id_fkey foreign key (workspace_id) references workspaces(id) on delete restrict;
alter table bookings add constraint bookings_workspace_id_fkey foreign key (workspace_id) references workspaces(id) on delete restrict;

create index if not exists rooms_workspace_active_idx on rooms(workspace_id, is_active, name);
create index if not exists bookings_workspace_date_idx on bookings(workspace_id, booking_date);
create index if not exists bookings_workspace_room_date_idx on bookings(workspace_id, room_id, booking_date);

-- The project enables RLS automatically for new tables. Keep the anonymous v1
-- demo working while its data access layer establishes the workspace boundary.
alter table workspaces enable row level security;
drop policy if exists "workspaces_v1_read" on workspaces;
create policy "workspaces_v1_read" on workspaces for select using (true);

-- Once auth is enabled, replace the v1 read policy with membership policies
-- using workspace_members.
