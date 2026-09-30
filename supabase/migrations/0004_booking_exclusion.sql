-- Enforce non-overlapping confirmed reservations even under simultaneous requests.
alter table bookings drop constraint if exists bookings_no_overlaps;
alter table bookings add constraint bookings_no_overlaps
  exclude using gist (
    workspace_id with =,
    room_id with =,
    booking_date with =,
    tsrange(booking_date + start_time, booking_date + end_time, '[)') with &&
  ) where (status = 'confirmed');
