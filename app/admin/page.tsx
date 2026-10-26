import Link from "next/link";
import { CancelBooking } from "@/components/cancel-booking";
import { listUpcomingBookings } from "@/lib/data/bookings";
import { listRooms } from "@/lib/data/rooms";

function formatTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${period}`;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room } = await searchParams;
  const [rooms, bookings] = await Promise.all([listRooms(), listUpcomingBookings(room)]);
  const confirmed = bookings.filter((booking) => booking.status === "confirmed").length;
  return <main className="app-shell executive-shell"><header className="app-header"><div className="brand-block"><p className="eyebrow"><i /> MEETING ROOMS</p><p className="location">Selangor Properties · Booking Administration</p></div><nav aria-label="Primary navigation"><Link href="/">Availability</Link><Link className="active" href="/admin">Admin console</Link></nav></header><section className="hero"><div><p className="eyebrow"><i /> ROOM BOOKING MANAGEMENT</p><h1>Manage Room Bookings</h1><p className="subtitle">View and manage all upcoming room bookings.</p></div><div className="hero-status"><span className="pulse" /> {confirmed} active</div></section><section className="date-bar"><div><span>Upcoming reservations</span><strong>{bookings.length} records</strong></div><form><select aria-label="Filter reservations by room" name="room" defaultValue={room ?? ""}><option value="">All rooms</option>{rooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button className="secondary">Filter</button></form></section><section className="panel admin-panel"><div className="panel-heading"><div><p className="eyebrow">TEAM SCHEDULE</p><h2>Reservations</h2></div><span className="count-chip">{confirmed} confirmed</span></div>{bookings.length === 0 ? <p className="muted">No upcoming reservations match this filter.</p> : <div className="reservation-table"><div className="table-head"><span>Date & time</span><span>Room</span><span>Meeting</span><span>Booked by</span><span>Status</span><span>Action</span></div>{bookings.map((booking) => <div className="table-row" key={booking.id}><span data-label="Date & time">{booking.booking_date}<small>{formatTime(booking.start_time)}–{formatTime(booking.end_time)}</small></span><span data-label="Room">{booking.rooms?.name ?? "Unknown room"}</span><span data-label="Meeting"><strong>{booking.title}</strong><small>Organiser: {booking.organiser}</small></span><span data-label="Booked by" className="booking-account">{booking.booked_by_email}</span><span data-label="Status" className={`status ${booking.status}`}>{booking.status}</span><span data-label="Action">{booking.status === "confirmed" ? <CancelBooking bookingId={booking.id} /> : <small>{booking.cancellation_reason}</small>}</span></div>)}</div>}</section><nav className="mobile-nav" aria-label="Mobile navigation"><Link href="/">Availability</Link><Link className="active" href="/admin">Admin</Link></nav></main>;
}
