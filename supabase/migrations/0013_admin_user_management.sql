-- Let workspace administrators audit and revoke staff access without deleting
-- Auth accounts or historical booking records.
create or replace function public.workspace_user_directory(target_workspace uuid)
returns table(
  user_id uuid,
  email text,
  full_name text,
  role text,
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
    m.created_at as joined_at
  from public.workspace_members m
  join auth.users u on u.id = m.user_id
  where m.workspace_id = target_workspace
    and exists (
      select 1
      from public.workspace_members requester
      where requester.workspace_id = target_workspace
        and requester.user_id = auth.uid()
        and requester.role in ('owner', 'admin')
    )
  order by lower(u.email);
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
begin
  if not exists (
    select 1
    from public.workspace_members requester
    where requester.workspace_id = target_workspace
      and requester.user_id = auth.uid()
      and requester.role in ('owner', 'admin')
  ) then
    raise exception 'Only administrators can remove user access.';
  end if;

  if target_user = auth.uid() then
    raise exception 'You cannot remove your own access.';
  end if;

  select role into target_role
  from public.workspace_members
  where workspace_id = target_workspace and user_id = target_user;

  if target_role is null then
    raise exception 'This user no longer has access.';
  end if;

  if target_role in ('owner', 'admin') then
    raise exception 'Administrator access cannot be removed here.';
  end if;

  delete from public.workspace_members
  where workspace_id = target_workspace and user_id = target_user;
end;
$$;

grant execute on function public.workspace_user_directory(uuid) to authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;
