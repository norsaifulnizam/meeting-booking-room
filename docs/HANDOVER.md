# Meeting Rooms handover

## Permanent links

- Live app: https://meeting-booking-room.vercel.app
- Source and complete Git history: https://github.com/norsaifulnizam/meeting-booking-room
- Vercel project: https://vercel.com/saiful11/meeting-booking-room
- Supabase project: https://supabase.com/dashboard/project/lsuiemeugrqjmtgqzpvg

## Current production behaviour

- Staff must sign in with a `@selangorproperties.com.my` email address.
- `norsaifulnizam@selangorproperties.com.my` is the workspace owner and can use the Admin console.
- Every signed-in staff member sees the team schedule and can cancel only their own reservation.
- Admins can view and cancel all reservations.
- Confirmed bookings cannot overlap in the same room and time range.

## Deployment and database

GitHub `main` deploys automatically to Vercel. Do not deploy manually: commit and push changes to `main`.

The production Supabase database has these applied migrations:

1. `0001_init.sql`
2. `0002_workspaces.sql`
3. `0003_auth_roles.sql`
4. `0004_booking_exclusion.sql`
5. `0005_team_schedule_visibility.sql`

The important support material is in `docs/`, including the product requirements, architecture, security notes, test plan, and human acceptance test brief.

## First actions for the next staff member

1. Sign in to GitHub, Vercel, and Supabase using the company-approved owner accounts.
2. Open the live app and create an office account; confirm it through the new email link.
3. Run the manual checks in `docs/HUMAN_TEST_BRIEF.md` after significant changes.
4. Keep `.env.local` private. It is deliberately excluded from GitHub.
