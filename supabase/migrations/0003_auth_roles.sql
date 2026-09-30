-- Office-only authentication and workspace roles.
create or replace function public.handle_workspace_member()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if lower(new.email) !~ '@selangorproperties[.]com[.]my$' then
    raise exception 'Use your @selangorproperties.com.my office email.';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (
    'c3c3c3c3-0000-0000-0000-000000000001',
    new.id,
    case when lower(new.email) = 'norsaifulnizam@selangorproperties.com.my' then 'owner' else 'member' end
  )
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_workspace_member();

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.workspace_members
  where workspace_id = target_workspace and user_id = auth.uid()
) $$;

create or replace function public.is_workspace_admin(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.workspace_members
  where workspace_id = target_workspace and user_id = auth.uid() and role in ('owner', 'admin')
) $$;

alter table workspace_members enable row level security;
drop policy if exists "members_read_self" on workspace_members;
create policy "members_read_self" on workspace_members for select using (user_id = auth.uid());

alter table rooms enable row level security;
drop policy if exists "rooms_v1_read" on rooms;
drop policy if exists "rooms_v1_write" on rooms;
create policy "rooms_member_read" on rooms for select using (is_workspace_member(workspace_id));
create policy "rooms_admin_write" on rooms for all using (is_workspace_admin(workspace_id)) with check (is_workspace_admin(workspace_id));

alter table bookings enable row level security;
drop policy if exists "bookings_v1_read" on bookings;
drop policy if exists "bookings_v1_write" on bookings;
create policy "bookings_read_own_or_admin" on bookings for select using (user_id = auth.uid() or is_workspace_admin(workspace_id));
create policy "bookings_create_own" on bookings for insert with check (user_id = auth.uid() and is_workspace_member(workspace_id));
create policy "bookings_update_own_or_admin" on bookings for update using (user_id = auth.uid() or is_workspace_admin(workspace_id)) with check (user_id = auth.uid() or is_workspace_admin(workspace_id));

-- Availability needs occupied/free slots, but never exposes another employee's meeting details.
create or replace function public.availability_slots(target_date date)
returns table(room_id uuid, start_time time, end_time time)
language sql stable security definer set search_path = public
as $$
  select b.room_id, b.start_time, b.end_time
  from public.bookings b
  join public.workspace_members m on m.workspace_id = b.workspace_id
  where m.user_id = auth.uid()
    and b.booking_date = target_date
    and b.status = 'confirmed'
$$;

grant execute on function public.availability_slots(date) to authenticated;
