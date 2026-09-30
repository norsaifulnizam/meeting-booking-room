# Tasks & Sprints

## Sprint 1 — Database & rooms core
- Create rooms + bookings tables, permissive RLS, seed 4 rooms + 5 bookings.
- `lib/data/rooms.ts`: list rooms (active only).
- `lib/data/bookings.ts`: list by date, overlap check, create, cancel.
- Unique partial index on confirmed bookings (room, date, start).
**DoD:** Tables exist, seeded rows load, data-access functions return seeded data.

## Sprint 2 — Availability & booking engine (v1 functional)
- Availability grid page: rooms × slots for a date; booked slots disabled.
- New booking form (room/date/start/end/title/organiser/attendees); submit persists.
- Server-side overlap re-check before insert; block with clear error.
- Cancel booking with reason; slot frees.
**DoD:** Success scenario works end-to-end — book a free slot, second overlapping attempt blocked. (v1 functional milestone.)

## Sprint 3 — Admin reservations view
- All upcoming reservations list + day calendar across rooms.
- Filter by room/date; cancel from admin view.
**DoD:** Admin sees all reservations in one view and can cancel any.

## Sprint 4 — Lock it down (later)
- Supabase email/password auth + signup/login.
- Replace permissive RLS: bookings owner-scoped, admin reads all, admins write rooms.
**DoD:** Logged-in non-admin sees only own bookings; admin sees all; anonymous blocked.

## Sprint 5 — Smart & later
- Auto-suggest room from free-text need (value+source+confidence+review_status).
- Usage analytics; recurring bookings; email reminders.
**DoD:** Suggestion returns top-3 ranked free rooms.

## Gantt
```
S1: DB + data access      [#=====]
S2: Availability + book   [  #=====]  v1 functional
S3: Admin view            [    #===]
S4: Lock down (auth/RLS)  [      #===]
S5: Smart/later           [        #===]
```
