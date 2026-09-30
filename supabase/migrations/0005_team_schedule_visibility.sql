-- Members may view the team's booked meeting details, while update rules still limit cancellation to the owner or an admin.
drop policy if exists "bookings_read_own_or_admin" on public.bookings;
create policy "bookings_read_team" on public.bookings
  for select using (is_workspace_member(workspace_id));
