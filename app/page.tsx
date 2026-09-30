import Link from "next/link";
import { BookingForm } from "@/components/booking-form";
import { CancelBooking } from "@/components/cancel-booking";
import { listBookingsForDate } from "@/lib/data/bookings";
import { listRooms } from "@/lib/data/rooms";

const slots = Array.from({ length: 10 }, (_, index) => `${String(index + 8).padStart(2, "0")}:00`);
const today = new Date().toISOString().slice(0, 10);
const formatDate = (date: string) => new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: requestedDate } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate ?? "") ? requestedDate! : today;
  let rooms = [] as Awaited<ReturnType<typeof listRooms>>;
  let bookings = [] as Awaited<ReturnType<typeof listBookingsForDate>>;
  let loadError = false;
  try { [rooms, bookings] = await Promise.all([listRooms(), listBookingsForDate(date)]); } catch { loadError = true; }
  const confirmed = bookings.filter((booking) => booking.status === "confirmed");
  const bookingAt = (roomId: string, slot: string) => confirmed.find((booking) => booking.room_id === roomId && booking.start_time.slice(0, 5) <= slot && booking.end_time.slice(0, 5) > slot);

  return <main className="app-shell">
    <header><div><p className="eyebrow">MEETING ROOMS</p><h1>Find a room that’s free.</h1><p className="subtitle">See live availability and reserve a space in minutes.</p></div><nav><Link className="active" href="/">Availability</Link><Link href="/admin">Admin</Link></nav></header>
    <section className="date-bar"><div><span>Availability for</span><strong>{formatDate(date)}</strong></div><form><input aria-label="Choose date" name="date" type="date" defaultValue={date} /><button className="secondary">View date</button></form></section>
    {loadError ? <section className="notice error">Couldn&apos;t load availability — retry.</section> : rooms.length === 0 ? <section className="notice">No rooms configured yet.</section> : <>
      <section className="availability-card"><div className="grid-scroll"><div className="availability-grid" style={{ gridTemplateColumns: `minmax(190px, 1.55fr) repeat(${slots.length}, minmax(74px, 1fr))` }}><div className="grid-heading">Room</div>{slots.map((slot) => <div className="grid-heading time" key={slot}>{slot}</div>)}{rooms.map((room) => <div key={room.id} className="grid-row"><div className="room-cell"><strong>{room.name}</strong><span>{room.location} · {room.capacity} seats</span></div>{slots.map((slot) => { const booking = bookingAt(room.id, slot); return <div className={`slot ${booking ? "booked" : "free"}`} key={slot} title={booking ? `${booking.title} · ${booking.organiser}` : "Free"}>{booking ? <span>{booking.title}</span> : <span>Free</span>}</div>; })}</div>)}</div></div><div className="legend"><span><i className="free-dot" /> Free</span><span><i className="booked-dot" /> Booked</span><span>Hours shown: 08:00–18:00</span></div></section>
      <section className="content-grid"><div className="panel"><p className="eyebrow">NEW RESERVATION</p><h2>Book a room</h2><p className="muted">Your booking is checked against the live schedule before it is confirmed.</p><BookingForm rooms={rooms} date={date} /></div><div className="panel current-bookings"><p className="eyebrow">ON THIS DAY</p><h2>Confirmed bookings</h2>{confirmed.length === 0 ? <p className="muted">Every room is currently free for this date.</p> : <div className="booking-list">{confirmed.map((booking) => <article key={booking.id}><div><strong>{booking.title}</strong><p>{rooms.find((room) => room.id === booking.room_id)?.name} · {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}</p><small>Organised by {booking.organiser}{booking.attendees ? ` · ${booking.attendees} attendees` : ""}</small></div><CancelBooking bookingId={booking.id} /></article>)}</div>}</div></section>
    </>}
  </main>;
}
