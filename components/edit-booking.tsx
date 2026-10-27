"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateBookingAction, type ActionState } from "@/app/actions";
import type { Booking, Room } from "@/lib/data/types";

const initialState: ActionState = {};

type EditBookingProps = { booking: Booking; rooms: Room[]; today: string };

export function EditBooking({ booking, rooms, today }: EditBookingProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateBookingAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) { setOpen(false); router.refresh(); }
  }, [state.success, router]);

  if (!open) return <button type="button" className="secondary edit-button" onClick={() => setOpen(true)}>Edit</button>;

  return <form action={action} className="edit-booking-form">
    <input type="hidden" name="booking_id" value={booking.id} />
    <label>Room<select name="room_id" defaultValue={booking.room_id} required>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
    <div className="edit-row"><label>Date<input name="booking_date" type="date" min={today} defaultValue={booking.booking_date} required /></label><label>Start<input name="start_time" type="time" min="09:00" max="18:00" defaultValue={booking.start_time.slice(0, 5)} required /></label><label>End<input name="end_time" type="time" min="09:00" max="18:00" defaultValue={booking.end_time.slice(0, 5)} required /></label></div>
    <label>Meeting purpose<input name="title" defaultValue={booking.title} required /></label>
    <div className="edit-row"><label>Organiser<input name="organiser" defaultValue={booking.organiser} required /></label><label>No. of attendees <input name="attendees" type="number" min="1" step="1" inputMode="numeric" defaultValue={booking.attendees} /></label></div>
    {state.error && <p className="inline-error">{state.error}</p>}
    <div className="edit-controls"><button className="primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button><button type="button" className="secondary" disabled={pending} onClick={() => setOpen(false)}>Close</button></div>
  </form>;
}
