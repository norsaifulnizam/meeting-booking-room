import Link from "next/link";
import { BookingForm } from "@/components/booking-form";
import { CancelBooking } from "@/components/cancel-booking";
import { LogoutButton } from "@/components/logout-button";
import { listAvailabilitySlots, listMyBookingsForDate } from "@/lib/data/bookings";
import { getCurrentMembership } from "@/lib/data/auth";
import { listRooms } from "@/lib/data/rooms";

const slots = Array.from({ length: 10 }, (_, index) => `${String(index + 8).padStart(2, "0")}:00`);
const today = new Date().toISOString().slice(0, 10);
const formatDate = (date: string) => new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: requestedDate } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate ?? "") ? requestedDate! : today;
  let rooms = [] as Awaited<ReturnType<typeof listRooms>>;
  let availabilitySlots = [] as Awaited<ReturnType<typeof listAvailabilitySlots>>;
  let bookings = [] as Awaited<ReturnType<typeof listMyBookingsForDate>>;
  let loadError = false;
  const membership = await getCurrentMembership();
  const isAdmin = membership.role === "owner" || membership.role === "admin";
  try { [rooms, availabilitySlots, bookings] = await Promise.all([listRooms(), listAvailabilitySlots(date), listMyBookingsForDate(date)]); } catch { loadError = true; }
  const bookingAt = (roomId: string, slot: string) => availabilitySlots.find((booking) => booking.room_id === roomId && booking.start_time.slice(0, 5) <= slot && booking.end_time.slice(0, 5) > slot);

  return <main className="app-shell executive-shell">
    <header className="app-header"><div className="brand-block"><p className="eyebrow"><i /> MEETING ROOMS</p><p className="location">Corporate workspace · {membership.email}</p></div><div className="header-actions"><nav aria-label="Primary navigation"><Link className="active" href="/">Availability</Link>{isAdmin && <Link href="/admin">Admin console</Link>}</nav><LogoutButton /></div></header>
    <section className="hero"><div><p className="eyebrow"><i /> LIVE AVAILABILITY</p><h1>Find a room that&apos;s free.</h1><p className="subtitle">Reserve an executive space with live, team-scoped availability.</p></div><div className="hero-status"><span className="pulse" /> Live schedule</div></section>
    <section className="date-bar"><div><span>Selected timeline</span><strong>{formatDate(date)}</strong></div><form><input aria-label="Choose date" name="date" type="date" defaultValue={date} /><button className="secondary">View date</button></form></section>
    {loadError ? <section className="notice error">Couldn&apos;t load availability — retry.</section> : rooms.length === 0 ? <section className="notice">No rooms configured yet.</section> : <>
      <section className="availability-card"><div className="schedule-label"><strong>Interactive floor schedule</strong><span>08:00–18:00 · Swipe to view</span></div><div className="grid-scroll"><div className="availability-grid" style={{ gridTemplateColumns: `minmax(200px, 1.55fr) repeat(${slots.length}, minmax(76px, 1fr))` }}><div className="grid-heading">Room</div>{slots.map((slot) => <div className="grid-heading time" key={slot}>{slot}</div>)}{rooms.map((room) => <div key={room.id} className="grid-row"><div className="room-cell"><strong>{room.name}</strong><span>{room.location} · {room.capacity} seats</span></div>{slots.map((slot) => { const booking = bookingAt(room.id, slot); return <div className={`slot ${booking ? "booked" : "free"}`} key={slot} title={booking ? "Booked" : "Free"}>{booking ? <span>Booked</span> : <span>Free</span>}</div>; })}</div>)}</div></div><div className="legend"><span><i className="free-dot" /> Available</span><span><i className="booked-dot" /> Occupied</span><span>Times update from the live team schedule</span></div></section>
      <section className="content-grid"><div className="panel booking-panel"><p className="eyebrow">NEW RESERVATION</p><h2>Book a room</h2><p className="muted">Availability is checked again before your reservation is confirmed.</p><BookingForm rooms={rooms} date={date} /></div><div className="panel current-bookings"><div className="panel-heading"><div><p className="eyebrow">YOUR SCHEDULE</p><h2>My bookings</h2></div><span className="count-chip">{bookings.length} active</span></div>{bookings.length === 0 ? <p className="muted">You have no confirmed bookings for this date.</p> : <div className="booking-list">{bookings.map((booking) => <article key={booking.id}><div><strong>{booking.title}</strong><p>{rooms.find((room) => room.id === booking.room_id)?.name} · {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}</p><small>Organised by {booking.organiser}{booking.attendees ? ` · ${booking.attendees} attendees` : ""}</small></div><CancelBooking bookingId={booking.id} /></article>)}</div>}</div></section>
    </>}
    <nav className="mobile-nav" aria-label="Mobile navigation"><Link className="active" href="/">Availability</Link>{isAdmin && <Link href="/admin">Admin</Link>}</nav>
  </main>;
}
