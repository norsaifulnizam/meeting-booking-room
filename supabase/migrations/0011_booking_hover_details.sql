-- Include each meeting's details for individual availability-cell hover tooltips.
drop function if exists public.team_availability_slots(date);
create or replace function public.team_availability_slots(target_date date)
returns table(room_id uuid, start_time time, end_time time, booked_by text, meeting_title text, attendees text)
language sql stable security definer set search_path = public, auth
as $$
  select b.room_id, b.start_time, b.end_time,
    coalesce(nullif(trim(b.organiser), ''), nullif(split_part(u.email, '@', 1), ''), 'Booked') as booked_by,
    b.title as meeting_title,
    b.attendees
  from public.bookings b
  left join auth.users u on u.id = b.user_id
  join public.workspace_members m on m.workspace_id = b.workspace_id
  where m.user_id = auth.uid()
    and b.booking_date = target_date
    and b.status = 'confirmed'
$$;

grant execute on function public.team_availability_slots(date) to authenticated;