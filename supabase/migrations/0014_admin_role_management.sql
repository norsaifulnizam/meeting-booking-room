-- Permit admins to manage other administrators while retaining at least one
-- administrator and protecting owner/self access.
create or replace function public.remove_workspace_member(
  target_workspace uuid,
  target_user uuid
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target_role text;
  administrator_count integer;
begin
  if not exists (
    select 1 from public.workspace_members requester
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
  if target_role = 'owner' then
    raise exception 'Owner access cannot be removed here.';
  end if;

  if target_role = 'admin' then
    select count(*) into administrator_count
    from public.workspace_members
    where workspace_id = target_workspace and role in ('owner', 'admin');
    if administrator_count <= 1 then
      raise exception 'Keep at least one administrator with access.';
    end if;
  end if;

  delete from public.workspace_members
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
    raise exception 'This user no longer has access.';
  end if;
  if current_role = 'owner' then
    raise exception 'Owner role cannot be changed here.';
  end if;

  if current_role = 'admin' and target_role = 'member' then
    select count(*) into administrator_count
    from public.workspace_members
    where workspace_id = target_workspace and role in ('owner', 'admin');
    if administrator_count <= 1 then
      raise exception 'Keep at least one administrator with access.';
    end if;
  end if;

  update public.workspace_members
  set role = target_role
  where workspace_id = target_workspace and user_id = target_user;
end;
$$;

grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.set_workspace_member_role(uuid, uuid, text) to authenticated;
