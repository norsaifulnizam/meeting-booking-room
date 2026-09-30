# Architecture

## Stack
Next.js (App Router) + Supabase (Postgres) + Vercel. TypeScript.

## Build now vs later
- **Now:** room directory, availability grid, booking engine with overlap check, cancel, admin reservations view.
- **Later:** login/RLS, recurring bookings, analytics, room suggestion, reminders.

## Key action flow (book a room)
1. User picks a date on the availability page.
2. App queries confirmed bookings for that date across all rooms (data layer).
3. Grid renders rooms × slots; booked slots disabled.
4. User fills form (room, start, end, title, organiser, attendees), submits.
5. Data layer re-checks overlap server-side before insert; if clear, inserts a confirmed booking.
6. Grid refreshes; the slot is now booked.

## Nav shell
Persistent left sidebar (desktop) collapsing to hamburger (mobile): Availability, My Bookings, Admin (later). Single highlighted current section.

## Layer plan
1. **Data** — rooms + bookings tables, constraints, demo seeds, data-access layer.
2. **App logic** — overlap check, create/cancel, grid building.
3. **Smart features** — room suggestion, analytics (later).

The core booking engine runs entirely on data + logic — no AI needed. AI only adds suggestions later.

## Repo structure (feature-oriented)
```
lib/data/rooms.ts, bookings.ts   # all DB reads/writes
lib/overlap.ts                    # booking conflict logic
lib/ai/suggest.ts                 # later
app/availability/                 # availability grid + booking form
app/admin/                        # all reservations
components/                       # UI only
__tests__
```

## Module map
| Module | Responsibility | Owns | Build order |
|---|---|---|---|
| `data` | all DB access | rooms, bookings | 1 |
| `overlap` | conflict check | overlap rule | 2 |
| `availability` | grid + new booking | booking UI | 3 |
| `admin` | all reservations view | admin UI | 4 |
| `auth` (later) | login + RLS | users/ownership | 5 |
| `ai` (later) | room suggestion | suggestion | 6 |
