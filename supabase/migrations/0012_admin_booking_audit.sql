-- Provide administrators with the account email that created each reservation.
-- The function checks the caller's workspace role before reading Auth user data.
create or replace function public.admin_upcoming_bookings(
  target_workspace uuid,
  target_room uuid default null
)
returns table(
  id uuid,
  workspace_id uuid,
  user_id uuid,
  room_id uuid,
  booking_date date,
  start_time time,
  end_time time,
  title text,
  organiser text,
  attendees text,
  status text,
  cancellation_reason text,
  created_at timestamptz,
  booked_by_email text
)
language sql stable security definer set search_path = public, auth
as $$
  select
    b.id,
    b.workspace_id,
    b.user_id,
    b.room_id,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.title,
    b.organiser,
    b.attendees,
    b.status::text,
    b.cancellation_reason,
    b.created_at,
    coalesce(u.email, 'Unknown account')
  from public.bookings b
  left join auth.users u on u.id = b.user_id
  where b.workspace_id = target_workspace
    and b.booking_date >= current_date
    and (target_room is null or b.room_id = target_room)
    and exists (
      select 1
      from public.workspace_members requester
      where requester.workspace_id = b.workspace_id
        and requester.user_id = auth.uid()
        and requester.role in ('owner', 'admin')
    )
  order by b.booking_date, b.start_time;
$$;

grant execute on function public.admin_upcoming_bookings(uuid, uuid) to authenticated;
