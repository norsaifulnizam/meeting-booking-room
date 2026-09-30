create extension if not exists btree_gist;

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  location text,
  capacity int not null default 4,
  facilities text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  room_id uuid not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  title text not null,
  organiser text not null,
  attendees text not null default '',
  status text not null default 'confirmed',
  cancellation_reason text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_room_date_idx on bookings(room_id, booking_date);
create unique index if not exists bookings_no_exact_dup
  on bookings(room_id, booking_date, start_time)
  where status = 'confirmed';

alter table rooms enable row level security;
drop policy if exists "rooms_v1_read" on rooms; create policy "rooms_v1_read" on rooms for select using (true);
drop policy if exists "rooms_v1_write" on rooms; create policy "rooms_v1_write" on rooms for all using (true) with check (true);

alter table bookings enable row level security;
drop policy if exists "bookings_v1_read" on bookings; create policy "bookings_v1_read" on bookings for select using (true);
drop policy if exists "bookings_v1_write" on bookings; create policy "bookings_v1_write" on bookings for all using (true) with check (true);

insert into rooms (id, name, location, capacity, facilities, is_active) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'Conference Room', 'Floor 3', 12, '{"projector","video","whiteboard"}', true),
  ('a1a1a1a1-0000-0000-0000-000000000002', 'Meeting Room', 'Floor 3', 6, '{"whiteboard","tv"}', true),
  ('a1a1a1a1-0000-0000-0000-000000000003', 'Discussion Room', 'Floor 2', 3, '{"whiteboard"}', true),
  ('a1a1a1a1-0000-0000-0000-000000000004', 'Phone Booth Room', 'Floor 3', 1, '{"phone","ac"}', true),
  ('a1a1a1a1-0000-0000-0000-000000000004', 'Focus Pod', 'Floor 4', 2, '{"whiteboard"}', true)
  on conflict (id) do nothing;

insert into bookings (id, room_id, booking_date, start_time, end_time, title, organiser, attendees, status, cancellation_reason) values
  ('b2b2b2b2-0000-0000-0000-000000000001', 'a1a1a1a1-0000-0000-0000-000000000001', current_date, '09:00', '10:00', 'Quarterly Review', 'Sarah Tan', '5', 'confirmed', null),
  ('b2b2b2b2-0000-0000-0000-000000000002', 'a1a1a1a1-0000-0000-0000-000000000002', current_date, '14:00', '15:00', 'Sprint Planning', 'James Lee', '4', 'confirmed', null),
  ('b2b2b2b2-0000-0000-0000-000000000003', 'a1a1a1a1-0000-0000-0000-000000000003', current_date, '10:00', '12:00', 'All-Hands Town Hall', 'Mei Wong', '25', 'cancelled', 'Moved to next week'),
  ('b2b2b2b2-0000-0000-0000-000000000004', 'a1a1a1a1-0000-0000-0000-000000000001', current_date, '11:00', '12:00', 'Client Demo', 'Ravi Kumar', '8', 'confirmed', null),
  ('b2b2b2b2-0000-0000-0000-000000000005', 'a1a1a1a1-0000-0000-0000-000000000002', current_date, '10:00', '10:30', 'Quick Sync', 'Anita Goh', '2', 'confirmed', null)
  on conflict (id) do nothing;
