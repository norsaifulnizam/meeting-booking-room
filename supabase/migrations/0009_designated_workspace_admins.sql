-- Make the designated meeting-room administrators automatic admins, including existing accounts.
create or replace function public.handle_workspace_member()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if lower(split_part(new.email, '@', 2)) not in (
    'menaramilenium.com.my',
    'selangorproperties.com.my',
    'spbpm.com.my',
    'thefive.com.my'
  ) then
    raise exception 'This user is not found in our system.';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (
    'c3c3c3c3-0000-0000-0000-000000000001',
    new.id,
    case when lower(new.email) in (
      'norsaifulnizam@selangorproperties.com.my',
      'chyap@selangorproperties.com.my'
    ) then 'admin' else 'member' end
  )
  on conflict (workspace_id, user_id) do update
    set role = excluded.role;
  return new;
end;
$$;

update public.workspace_members as membership
set role = case
  when lower(users.email) in (
    'norsaifulnizam@selangorproperties.com.my',
    'chyap@selangorproperties.com.my'
  ) then 'admin'
  else 'member'
end
from auth.users as users
where users.id = membership.user_id
  and membership.workspace_id = 'c3c3c3c3-0000-0000-0000-000000000001';