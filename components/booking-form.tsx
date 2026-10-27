"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction, type ActionState } from "@/app/actions";
import type { Room } from "@/lib/data/types";

const initialState: ActionState = {};

export function BookingForm({ rooms, date }: { rooms: Room[]; date: string }) {
  const [state, action, pending] = useActionState(createBookingAction, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) { formRef.current?.reset(); router.refresh(); } }, [state.success, router]);
  return <form ref={formRef} action={action} className="booking-form">
    <input type="hidden" name="booking_date" value={date} />
    <label>Room<select name="room_id" required><option value="">Choose a room</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.capacity} seats</option>)}</select></label>
    <div className="field-row"><label>Start<input name="start_time" type="time" min="09:00" max="18:00" required /></label><label>End<input name="end_time" type="time" min="09:00" max="18:00" required /></label></div>
    <label>Meeting purpose<input name="title" required placeholder="e.g. Budget Review" /></label>
    <div className="field-row"><label>Organiser<input name="organiser" required placeholder="Your name" /></label><label>No. of attendees <input name="attendees" type="number" min="1" step="1" inputMode="numeric" placeholder="e.g. 6" /></label></div>
    {state.error && <p className="form-message error" role="alert">{state.error}</p>}{state.success && <p className="form-message success">{state.success}</p>}
    <button className="primary" disabled={pending}>{pending ? "Confirming…" : "Book room"}</button>
  </form>;
}
