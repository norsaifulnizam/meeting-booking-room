# Agentic Layer

## Draftable actions (low risk, auto)
- Suggest a room for a stated need (draft only, user confirms). v1: none. Later.
- Tag/classify a booking (internal vs client). Later.

## Executable-after-approval (medium)
- Cancel a future booking on behalf of a user after light approval. Later.
- Draft a recurring booking series for approval. Later.

## Human-only (critical)
- Delete a booking permanently (cancelled = soft state only).
- Disable or remove a room.
- Any data deletion.

## Named tools (approved only)
- `check_room_availability(room_id, date)` — read.
- `create_booking(payload)` — write, after overlap check.
- `cancel_booking(id, reason)` — write.
- No raw run_any / send_any.

## Audit log fields (later)
actor_id, action, target_table, target_id, before, after, timestamp.

## v1 vs later
- **v1:** human drives all actions via UI; no autonomous agents.
- **Later:** suggestion agent drafts; admin approves cancellations; everything logged.
