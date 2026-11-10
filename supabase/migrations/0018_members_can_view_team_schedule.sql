-- Active staff may view the team's confirmed schedule. Booking updates and
-- cancellations remain restricted to the booking owner or an administrator.
drop policy if exists "bookings_read_own_or_admin" on public.bookings;
drop policy if exists "bookings_read_team" on public.bookings;

create policy "bookings_read_team" on public.bookings
  for select using (public.is_workspace_member(workspace_id));
