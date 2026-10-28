"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction, type ActionState } from "@/app/actions";
import type { Room } from "@/lib/data/types";

const initialState: ActionState = {};

export function BookingForm({ rooms, today, maxDate }: { rooms: Room[]; today: string; maxDate: string }) {
  const [state, action, pending] = useActionState(createBookingAction, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [bookingDate, setBookingDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [bookingType, setBookingType] = useState<"single" | "range">("single");
  useEffect(() => { if (state.success) { formRef.current?.reset(); router.refresh(); } }, [state.success, router]);
  const weekdayCount = (() => {
    if (bookingType === "single") return 1;
    let count = 0;
    const cursor = new Date(`${bookingDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    while (cursor <= end) {
      const day = cursor.getUTCDay();
      if (day !== 0 && day !== 6) count += 1;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return count;
  })();
  return <form ref={formRef} action={action} className="booking-form">
    <label>Room<select name="room_id" required><option value="">Choose a room</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.capacity} seats</option>)}</select></label>
    <fieldset className="booking-type"><legend>Booking type</legend><label><input type="radio" name="booking_type" checked={bookingType === "single"} onChange={() => setBookingType("single")} /> Single date</label><label><input type="radio" name="booking_type" checked={bookingType === "range"} onChange={() => setBookingType("range")} /> Date range</label></fieldset>
    <div className={bookingType === "range" ? "field-row" : ""}><label>{bookingType === "range" ? "Start date" : "Booking date"}<input name="booking_date" type="date" min={today} max={maxDate} value={bookingDate} onChange={(event) => { setBookingDate(event.target.value); if (event.target.value > endDate) setEndDate(event.target.value); }} required /></label>{bookingType === "range" && <label>End date<input name="end_date" type="date" min={bookingDate} max={maxDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} required /></label>}</div>
    {bookingType === "range" && <p className="range-note">{weekdayCount > 0 ? `${weekdayCount} weekday bookings will be created. Saturday and Sunday are skipped.` : "Choose a range with at least one weekday."}</p>}
    <div className="field-row"><label>Start<input name="start_time" type="time" min="09:00" max="18:00" required /></label><label>End<input name="end_time" type="time" min="09:00" max="18:00" required /></label></div>
    <label>Meeting purpose<input name="title" required placeholder="e.g. Budget Review" /></label>
    <div className="field-row"><label>Organiser<input name="organiser" required placeholder="Your name" /></label><label>No. of attendees <input name="attendees" type="number" min="1" step="1" inputMode="numeric" placeholder="e.g. 6" /></label></div>
    {state.error && <p className="form-message error" role="alert">{state.error}</p>}{state.success && <p className="form-message success">{state.success}</p>}
    <button className="primary" disabled={pending || weekdayCount === 0}>{pending ? "Confirming…" : bookingType === "range" ? `Book ${weekdayCount} weekdays` : "Book room"}</button>
  </form>;
}
