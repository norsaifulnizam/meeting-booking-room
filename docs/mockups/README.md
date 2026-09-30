# UI refresh mockups

Open `availability-admin-refresh.html` in a browser for a responsive visual proposal.

The direction is a calm operational console: the availability screen prioritises scan speed and booking confidence, while the admin view gives operations a short health summary before the reservation list. The visual system uses a navy foundation, a lime brand accent and semantic state colours that do not rely on colour alone.

## Proposed interaction changes

- Make a selected free grid cell prefill the room and time in the booking form; retain server-side availability validation at confirmation.
- Keep booking fields in a nearby desktop side panel. On small screens, present that form before the horizontally scrollable timetable, then retain a sticky booking summary after a slot is selected.
- Add a compact `My bookings` destination when tenant/user work lands, so staff can quickly find and cancel their own reservations.
- Add admin summary metrics and room/status filters; collapse the reservation data into two-column cards on narrow screens.

## Implementation notes

- Preserve the current semantic `confirmed` / `cancelled` status text and use a status badge alongside it.
- Retain a `min-width` timetable with a visible horizontal affordance on mobile. A dense vertical transform loses the essential rooms × time comparison.
- Ensure every state colour meets contrast requirements with its text, and expose booking information through accessible labels/tooltips for grid cells.
