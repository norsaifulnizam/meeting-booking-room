# Data Model

## rooms
| field | type | notes |
|---|---|---|
| id | uuid pk | gen_random_uuid() |
| user_id | uuid nullable | owner, for later RLS |
| name | text not null | e.g. "Boardroom A" |
| location | text | e.g. "Floor 3" |
| capacity | int not null | default 4 |
| facilities | text[] | {"projector","video","whiteboard"} |
| is_active | bool | default true |
| created_at | timestamptz | default now() |

RLS v1: permissive read/write (demo). Later: admin write only.

## bookings
| field | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid nullable | creator, later RLS |
| room_id | uuid not null | references rooms (no FK enforced in v1) |
| booking_date | date not null | |
| start_time | time not null | |
| end_time | time not null | must be > start_time (app check) |
| title | text not null | meeting title |
| organiser | text not null | name |
| attendees | text | comma-separated names/count |
| status | text not null | confirmed / cancelled |
| cancellation_reason | text | set on cancel |
| created_at | timestamptz | |

Index: `(room_id, booking_date)`. Unique partial index on `(room_id, booking_date, start_time)` where `status='confirmed'` guards exact-slot duplicates; full overlap prevention is enforced in the data-access layer (range check before insert).

RLS v1: permissive. Later: creator owns bookings; admin role reads/cancels all.

No AI-generated fields in v1. (Later "suggested room" adds `source`, `confidence`, `review_status` to a suggestions table — not in v1.)
