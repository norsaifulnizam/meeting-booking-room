-- Import the bookings exported from the legacy Meeting Room Booking System on 5 November 2026.
-- Every imported reservation is managed by the designated migration administrator, while the
-- original organiser remains visible in the availability grid and booking details.
-- The legacy Auditor reservation spans multiple days, so it is represented as one reservation
-- for every working day in that source interval. Existing overlapping bookings are retained and
-- never overwritten by this import.
do $$
declare
  target_workspace uuid := 'c3c3c3c3-0000-0000-0000-000000000001';
  migration_user uuid;
begin
  select id into migration_user
  from auth.users
  where lower(email) = 'norsaifulnizam@selangorproperties.com.my'
  limit 1;

  if migration_user is null then
    raise exception 'Cannot import legacy bookings: migration administrator account was not found.';
  end if;

  with source_bookings(room_name, booking_date, start_time, end_time, title, organiser, multi_day_end) as (
    values
      ('Conference Room', date '2026-11-05', time '14:00', time '15:00', 'Meeting with FP', 'Katherine Chew', null::date),
      ('Conference Room', date '2026-11-05', time '15:00', time '16:30', 'Sales & Marketing Meeting', 'Katherine Chew', null::date),
      ('Conference Room', date '2026-11-06', time '15:00', time '17:00', 'Booked By Saiful — AI Coaching', 'Nor Saifulnizam Ahmad Sidi', null::date),
      ('Conference Room', date '2026-11-12', time '09:00', time '11:30', 'Meeting with FP', 'Katherine Chew', null::date),
      ('Conference Room', date '2026-11-12', time '11:30', time '13:00', 'Sales & Marketing Meeting', 'Katherine Chew', null::date),
      ('Conference Room', date '2026-11-12', time '14:00', time '15:00', 'NNE Meeting', 'Katherine Chew', null::date),
      ('Conference Room', date '2026-11-12', time '15:00', time '16:00', 'PBT | Land matters', 'Leen Lee', null::date),
      ('Conference Room', date '2026-11-19', time '09:00', time '12:00', 'Meeting with FP', 'Katherine Chew', null::date),
      ('Conference Room', date '2026-11-26', time '09:00', time '12:00', 'Meeting with FP', 'Katherine Chew', null::date),
      ('Conference Room', date '2026-11-26', time '15:00', time '16:00', 'PBT | Land matters', 'Leen Lee', null::date),
      ('Meeting Room', date '2026-11-05', time '11:00', time '12:30', 'Booked by Vivian', 'Nor Saifulnizam Ahmad Sidi', null::date),
      ('Meeting Room', date '2026-11-06', time '09:00', time '10:00', 'Marketing Meeting', 'Katherine Chew', null::date),
      ('Meeting Room', date '2026-11-06', time '10:00', time '11:00', 'Douglas', 'Leen Lee', null::date),
      ('Meeting Room', date '2026-11-12', time '10:00', time '11:00', 'CEO|Edmund|Mike', 'Leen Lee', null::date),
      ('Meeting Room', date '2026-11-12', time '15:00', time '16:00', 'CEO | Cheong', 'Leen Lee', null::date),
      ('Meeting Room', date '2026-11-18', time '15:00', time '16:00', 'Vivian', 'Leen Lee', null::date),
      ('Meeting Room', date '2026-11-19', time '14:30', time '16:00', 'Marketing Meeting', 'Katherine Chew', null::date),
      ('Meeting Room', date '2026-11-20', time '11:00', time '12:00', 'Booked by Norlila HB', 'Nor Saifulnizam Ahmad Sidi', null::date),
      ('Meeting Room', date '2026-12-02', time '15:00', time '16:00', 'Vivian', 'Leen Lee', null::date),
      ('Meeting Room', date '2026-12-03', time '14:30', time '16:00', 'Marketing Meeting', 'Katherine Chew', null::date),
      ('Meeting Room', date '2026-12-08', time '10:00', time '11:00', 'Booked by Norlila HB', 'Nor Saifulnizam Ahmad Sidi', null::date),
      ('Meeting Room', date '2026-12-10', time '10:00', time '11:00', 'CEO|Edmund|Mike', 'Leen Lee', null::date),
      ('Meeting Room', date '2026-12-10', time '15:00', time '16:00', 'CEO | Cheong', 'Leen Lee', null::date),
      ('Meeting Room', date '2026-12-17', time '14:30', time '16:00', 'Marketing Meeting', 'Katherine Chew', null::date),
      ('Discussion Room', date '2026-10-13', time '09:00', time '18:30', 'Auditor', 'Nor Saifulnizam Ahmad Sidi', date '2026-12-09')
  ), expanded_bookings as (
    select
      source_bookings.room_name,
      coalesce(days.booking_date::date, source_bookings.booking_date) as booking_date,
      source_bookings.start_time,
      source_bookings.end_time,
      source_bookings.title,
      source_bookings.organiser
    from source_bookings
    left join lateral generate_series(
      source_bookings.booking_date::timestamp,
      source_bookings.multi_day_end::timestamp,
      interval '1 day'
    ) as days(booking_date) on source_bookings.multi_day_end is not null
    where source_bookings.multi_day_end is null
       or extract(isodow from days.booking_date) between 1 and 5
  )
  insert into public.bookings (
    workspace_id, user_id, room_id, booking_date, start_time, end_time,
    title, organiser, attendees, status
  )
  select
    target_workspace,
    migration_user,
    rooms.id,
    expanded_bookings.booking_date,
    expanded_bookings.start_time,
    expanded_bookings.end_time,
    expanded_bookings.title,
    expanded_bookings.organiser,
    '',
    'confirmed'
  from expanded_bookings
  join public.rooms rooms
    on rooms.workspace_id = target_workspace
   and rooms.name = expanded_bookings.room_name
  where not exists (
    select 1
    from public.bookings existing
    where existing.workspace_id = target_workspace
      and existing.room_id = rooms.id
      and existing.booking_date = expanded_bookings.booking_date
      and existing.status = 'confirmed'
      and existing.start_time < expanded_bookings.end_time
      and expanded_bookings.start_time < existing.end_time
  );
end $$;
