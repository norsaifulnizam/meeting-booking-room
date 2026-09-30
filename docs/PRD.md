# Meeting Room Booking — PRD

## Problem
Staff book meeting rooms by calling IT or using a local PC system accessed only via IP. Bookings conflict, IT wastes time as middleman, and rooms sit unused or double-booked.

## Target user
All employees. A secondary admin role (IT) manages the room list and oversees all reservations.

## Core objects
- **Room** — name, location, capacity, facilities/equipment, active flag.
- **Booking** — room, date, start time, end time, title, organiser, attendees, status (confirmed/cancelled), cancellation reason.

## MVP (v1) — must-haves
- [ ] Room directory showing capacity + facilities.
- [ ] Availability grid: rooms × time slots for a chosen date.
- [ ] Create booking form (room, date, start, end, title, organiser, attendees) that persists to DB.
- [ ] Double-booking prevented automatically for the same room + overlapping time.
- [ ] Cancel a booking with a cancellation reason; cancelled slots free up.
- [ ] Admin view: all upcoming reservations in one list + day calendar.
- [ ] Works in preview, anonymous (no login wall), seeded demo data.

## Non-goals (v1)
- No mobile app (web only).
- No Outlook / Microsoft Teams integration.
- No login/auth in v1 (added later, with per-user data isolation).
- No recurring bookings, no usage analytics.

## Success criteria (concrete end-to-end)
An employee opens the availability page for today, sees Boardroom A is free 13:00–14:00, books it in one form, and sees the slot turn booked instantly. A second attempt to book Boardroom A 13:30–14:00 is blocked with a clear "room already booked" message. No phone call to IT needed.
