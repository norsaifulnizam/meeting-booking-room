-- Keep departed staff in the audit trail while removing their ability to use
-- the application. Administrators can restore them later without recreating
-- their Auth account or losing their booking history.
alter table public.workspace_members
  add column if not exists is_active boolean not null default true;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.is_workspace_admin(target_workspace uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and is_active = true
      and role in ('owner', 'admin')
  );
$$;

drop function if exists public.workspace_user_directory(uuid);
create function public.workspace_user_directory(target_workspace uuid)
returns table(
  user_id uuid,
  email text,
  full_name text,
  role text,
  is_active boolean,
  joined_at timestamptz
)
language sql stable security definer set search_path = public, auth
as $$
  select
    m.user_id,
    u.email,
    coalesce(
      nullif(trim(concat_ws(' ', u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'last_name')), ''),
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      split_part(u.email, '@', 1)
    ) as full_name,
    m.role,
    m.is_active,
    m.created_at as joined_at
  from public.workspace_members m
  join auth.users u on u.id = m.user_id
  where m.workspace_id = target_workspace
    and exists (
      select 1 from public.workspace_members requester
      where requester.workspace_id = target_workspace
        and requester.user_id = auth.uid()
        and requester.is_active = true
        and requester.role in ('owner', 'admin')
    )
  order by m.is_active desc, lower(u.email);
$$;

create or replace function public.remove_workspace_member(
  target_workspace uuid,
  target_user uuid
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target_role text;
  target_active boolean;
  administrator_count integer;
begin
  if not exists (
    select 1 from public.workspace_members requester
    where requester.workspace_id = target_workspace
      and requester.user_id = auth.uid()
      and requester.is_active = true
      and requester.role in ('owner', 'admin')
  ) then
    raise exception 'Only administrators can remove user access.';
  end if;
  if target_user = auth.uid() then
    raise exception 'You cannot remove your own access.';
  end if;

  select role, is_active into target_role, target_active
  from public.workspace_members
  where workspace_id = target_workspace and user_id = target_user;
  if target_role is null then
    raise exception 'This user is not part of this workspace.';
  end if;
  if not target_active then
    raise exception 'This user already has inactive access.';
  end if;
  if target_role = 'owner' then
    raise exception 'Owner access cannot be removed here.';
  end if;
  if target_role = 'admin' then
    select count(*) into administrator_count
    from public.workspace_members
    where workspace_id = target_workspace
      and is_active = true
      and role in ('owner', 'admin');
    if administrator_count <= 1 then
      raise exception 'Keep at least one administrator with access.';
    end if;
  end if;

  update public.workspace_members
  set is_active = false
  where workspace_id = target_workspace and user_id = target_user;
end;
$$;

create or replace function public.restore_workspace_member(
  target_workspace uuid,
  target_user uuid
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.workspace_members requester
    where requester.workspace_id = target_workspace
      and requester.user_id = auth.uid()
      and requester.is_active = true
      and requester.role in ('owner', 'admin')
  ) then
    raise exception 'Only administrators can restore user access.';
  end if;
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace and user_id = target_user
  ) then
    raise exception 'This user is not part of this workspace.';
  end if;
  update public.workspace_members
  set is_active = true
  where workspace_id = target_workspace and user_id = target_user;
end;
$$;

create or replace function public.set_workspace_member_role(
  target_workspace uuid,
  target_user uuid,
  target_role text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  current_role text;
  administrator_count integer;
begin
  if target_role not in ('admin', 'member') then
    raise exception 'Choose either Admin or Member.';
  end if;
  if not exists (
    select 1 from public.workspace_members requester
    where requester.workspace_id = target_workspace
      and requester.user_id = auth.uid()
      and requester.is_active = true
      and requester.role in ('owner', 'admin')
  ) then
    raise exception 'Only administrators can change user roles.';
  end if;
  if target_user = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;
  select role into current_role
  from public.workspace_members
  where workspace_id = target_workspace and user_id = target_user;
  if current_role is null then
    raise exception 'This user is not part of this workspace.';
  end if;
  if current_role = 'owner' then
    raise exception 'Owner role cannot be changed here.';
  end if;
  if current_role = 'admin' and target_role = 'member' then
    select count(*) into administrator_count
    from public.workspace_members
    where workspace_id = target_workspace
      and is_active = true
      and role in ('owner', 'admin');
    if administrator_count <= 1 then
      raise exception 'Keep at least one administrator with access.';
    end if;
  end if;
  update public.workspace_members
  set role = target_role
  where workspace_id = target_workspace and user_id = target_user;
end;
$$;

-- Deactivated staff must not retain direct API access through policies or
-- security-definer scheduling functions.
drop policy if exists "bookings_read_own_or_admin" on public.bookings;
create policy "bookings_read_own_or_admin" on public.bookings for select
  using (public.is_workspace_member(workspace_id) and (user_id = auth.uid() or public.is_workspace_admin(workspace_id)));
drop policy if exists "bookings_update_own_or_admin" on public.bookings;
create policy "bookings_update_own_or_admin" on public.bookings for update
  using (public.is_workspace_member(workspace_id) and (user_id = auth.uid() or public.is_workspace_admin(workspace_id)))
  with check (public.is_workspace_member(workspace_id) and (user_id = auth.uid() or public.is_workspace_admin(workspace_id)));

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
    and m.is_active = true
    and b.booking_date = target_date
    and b.status = 'confirmed';
$$;

create or replace function public.admin_upcoming_bookings(target_workspace uuid, target_room uuid default null)
returns table(id uuid, workspace_id uuid, user_id uuid, room_id uuid, booking_date date, start_time time, end_time time, title text, organiser text, attendees text, status text, cancellation_reason text, created_at timestamptz, booked_by_email text)
language sql stable security definer set search_path = public, auth
as $$
  select b.id, b.workspace_id, b.user_id, b.room_id, b.booking_date, b.start_time, b.end_time, b.title, b.organiser, b.attendees, b.status::text, b.cancellation_reason, b.created_at, coalesce(u.email, 'Unknown account')
  from public.bookings b
  left join auth.users u on u.id = b.user_id
  where b.workspace_id = target_workspace
    and b.booking_date >= current_date
    and (target_room is null or b.room_id = target_room)
    and exists (
      select 1 from public.workspace_members requester
      where requester.workspace_id = b.workspace_id
        and requester.user_id = auth.uid()
        and requester.is_active = true
        and requester.role in ('owner', 'admin')
    )
  order by b.booking_date, b.start_time;
$$;

grant execute on function public.workspace_user_directory(uuid) to authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.restore_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.set_workspace_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.team_availability_slots(date) to authenticated;
grant execute on function public.admin_upcoming_bookings(uuid, uuid) to authenticated;
