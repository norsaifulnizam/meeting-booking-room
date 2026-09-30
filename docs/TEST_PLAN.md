# Test Plan

## Success scenario (v1)
1. Open `/availability` for today — grid shows 4 rooms, booked slots greyed.
2. Pick Boardroom A, 13:00–14:00 (free), fill title "Budget Sync", organiser "Sarah Tan", attendees "6".
3. Submit — slot turns booked; booking appears in grid.
4. Open a second tab, attempt Boardroom A 13:30–14:00 — submit shows "Room already booked for this time."
5. Cancel the 13:00 booking with reason "Room not needed" — slot returns to free.

## Empty / error cases
- **No rooms:** rooms list empty → availability shows "No rooms configured yet."
- **No bookings for date:** grid renders all slots free, no error.
- **End before start:** form blocks submit with "End time must be after start time."
- **Overlap conflict:** clear message naming the room; no partial save.
- **Cancel already cancelled:** button disabled; status shows "cancelled."
- **Loading:** grid shows skeleton while booking data loads.
- **Network/API error:** grid shows "Couldn't load availability — retry."

## Admin view
- Shows all confirmed + cancelled upcoming bookings across rooms.
- Filter by room narrows the list.
- Cancel action works and reflects in availability grid after refresh.
