# Human acceptance test brief

**App:** https://meeting-booking-room.vercel.app/  
**Purpose:** confirm an anonymous employee can find a free room, create a real reservation, prevent an overlapping reservation, and release the room through the admin flow.

## Before you begin

- Use the live production URL in a desktop browser. Open a second tab to the same URL for the conflict check.
- The demo workspace is shared. Choose a free room and an unused future date/time shown as **Free** in the schedule; do not rely on the PRD example time if it is already occupied.
- Use a unique title so the record can be found and safely cleaned up, for example `UAT <your initials> <YYYYMMDD-HHMM>`.
- Keep the first tab open until the cancellation test is complete.

## Core success test

1. On **Availability**, choose your test date with the date picker and select **View date**.
2. Confirm the grid displays rooms, time columns from 08:00–18:00, and the selected room/time is marked **Free**.
3. In **Book a room**, select that room and enter the selected start/end times, your unique title, organiser name, and attendees (for example `2`).
4. Select **Book room**.

**Expected result:** the form reports success, clears for the next booking, and the page refreshes. The new meeting appears under **Confirmed bookings** and its matching schedule cells show as occupied.

## Overlap prevention test

1. In the second tab, set the same date and submit another reservation for the **same room** that overlaps the first one (for example, start 30 minutes after the first booking starts and end at the original end time).
2. Use another unique title so it is clear this is the conflict attempt.

**Expected result:** submission is rejected with a clear message that the room is already booked for that time. The conflicting meeting does not appear in the schedule, confirmed-bookings list, or admin list.

## Cancellation and admin test

1. In the first tab, find the successful test booking under **Confirmed bookings**. Enter `UAT cleanup` as the cancellation reason and select **Cancel**.
2. Confirm it disappears from confirmed bookings and the original time becomes **Free** in the grid.
3. Open **Admin console**. If needed, use the room filter and select **Filter**.
4. Find the cancelled UAT booking in **Reservations**.

**Expected result:** the admin view keeps a record with status **cancelled** and shows the cancellation reason. It must not offer a second cancellation action. The availability page continues to show the released slot as free after refresh.

## Evidence to capture

Capture screenshots or screen recordings of:

1. The selected free slot before booking, including the date and room name.
2. The successful booking in both the occupied grid and **Confirmed bookings** list.
3. The overlap error message and the unchanged schedule/list.
4. The cancelled record and reason in **Admin console**, plus the released slot on Availability.

Record the production URL, test date, room, exact time range, unique title, browser/device, and any unexpected behaviour. Do not submit another test booking after the cleanup record is cancelled.
