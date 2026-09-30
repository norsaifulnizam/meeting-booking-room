-- Align the live room directory with the office's actual rooms.
update public.rooms set
  name = 'Conference Room', capacity = 12, facilities = '{"projector","video","whiteboard"}'
where id = 'a1a1a1a1-0000-0000-0000-000000000001';

update public.rooms set
  name = 'Meeting Room', capacity = 6, facilities = '{"whiteboard","tv"}'
where id = 'a1a1a1a1-0000-0000-0000-000000000002';

update public.rooms set
  name = 'Discussion Room', capacity = 3, facilities = '{"whiteboard"}'
where id = 'a1a1a1a1-0000-0000-0000-000000000003';

insert into public.rooms (id, workspace_id, name, location, capacity, facilities, is_active)
values ('a1a1a1a1-0000-0000-0000-000000000004', 'c3c3c3c3-0000-0000-0000-000000000001', 'Phone Booth Room', 'Floor 3', 1, '{"phone","ac"}', true)
on conflict (id) do update set
  name = excluded.name,
  location = excluded.location,
  capacity = excluded.capacity,
  facilities = excluded.facilities,
  is_active = excluded.is_active;
