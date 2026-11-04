-- Keep a tamper-resistant history of booking activity for administrators.
-- Events begin when this migration is applied; existing bookings are unchanged.
create table if not exists public.booking_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  action text not null check (action in ('created', 'updated', 'cancelled')),
  actor_user_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  snapshot jsonb not null default '{}'::jsonb
);

create index if not exists booking_audit_events_workspace_occurred_at_idx
  on public.booking_audit_events (workspace_id, occurred_at desc);

alter table public.booking_audit_events enable row level security;

drop policy if exists "booking_audit_admin_read" on public.booking_audit_events;
create policy "booking_audit_admin_read" on public.booking_audit_events for select
  using (public.is_workspace_admin(workspace_id));

create or replace function public.record_booking_audit_event()
returns trigger
language plpgsql security definer set search_path = public, auth
as $$
declare
  event_action text;
  event_booking public.bookings;
begin
  event_booking := case when tg_op = 'DELETE' then old else new end;
  if tg_op = 'INSERT' then
    event_action := 'created';
  elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    event_action := 'cancelled';
  else
    event_action := 'updated';
  end if;

  insert into public.booking_audit_events (workspace_id, booking_id, action, actor_user_id, snapshot)
  values (event_booking.workspace_id, event_booking.id, event_action, auth.uid(), to_jsonb(event_booking));
  return coalesce(new, old);
end;
$$;

drop trigger if exists booking_audit_history on public.bookings;
create trigger booking_audit_history
  after insert or update or delete on public.bookings
  for each row execute function public.record_booking_audit_event();

create or replace function public.admin_booking_audit_events(
  target_workspace uuid,
  event_limit integer default 100
)
returns table(
  id uuid,
  booking_id uuid,
  action text,
  actor_email text,
  occurred_at timestamptz,
  room_id uuid,
  booking_date date,
  start_time time,
  end_time time,
  title text,
  organiser text,
  cancellation_reason text
)
language sql stable security definer set search_path = public, auth
as $$
  select
    e.id,
    e.booking_id,
    e.action,
    coalesce(u.email, 'Unknown account') as actor_email,
    e.occurred_at,
    (e.snapshot ->> 'room_id')::uuid as room_id,
    (e.snapshot ->> 'booking_date')::date as booking_date,
    (e.snapshot ->> 'start_time')::time as start_time,
    (e.snapshot ->> 'end_time')::time as end_time,
    coalesce(e.snapshot ->> 'title', 'Untitled meeting') as title,
    coalesce(e.snapshot ->> 'organiser', 'Unknown organiser') as organiser,
    nullif(e.snapshot ->> 'cancellation_reason', '') as cancellation_reason
  from public.booking_audit_events e
  left join auth.users u on u.id = e.actor_user_id
  where e.workspace_id = target_workspace
    and exists (
      select 1 from public.workspace_members requester
      where requester.workspace_id = e.workspace_id
        and requester.user_id = auth.uid()
        and requester.is_active = true
        and requester.role in ('owner', 'admin')
    )
  order by e.occurred_at desc
  limit greatest(1, least(event_limit, 200));
$$;

grant execute on function public.admin_booking_audit_events(uuid, integer) to authenticated;
