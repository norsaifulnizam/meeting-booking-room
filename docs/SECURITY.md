# Security

## Secret handling
- Supabase URL + anon key: public, env-exposed, safe for browser.
- Service role key: server-only, never in frontend, never committed.

## Permission model
- **v1 (demo):** permissive RLS — anonymous can read rooms/bookings and create/cancel. Safe for internal preview with seeded data.
- **Lock-down (later):** owner-scoped RLS — `auth.uid() = user_id` for bookings; admin role (role claim) reads/cancels all; only admins write rooms.

## Approved-tools rule
Agents may call only named tools (`check_room_availability`, `create_booking`, `cancel_booking`). No raw SQL execution from the client beyond Supabase client with RLS. No arbitrary send.

## Audit principle
Every create/cancel writes enough state (status, cancellation_reason, created_at) to reconstruct what happened. Later: dedicated audit log per action.

## Honesty
Do not claim "secure" before the lock-down sprint ships owner-scoped RLS and is tested. v1 is intentionally open for demo only.
