import Image from "next/image";
import Link from "next/link";
import { BookingForm } from "@/components/booking-form";
import { CancelBooking } from "@/components/cancel-booking";
import { DateNavigation } from "@/components/date-navigation";
import { LogoutButton } from "@/components/logout-button";
import { listAvailabilitySlots, listTeamBookingsForDate } from "@/lib/data/bookings";
import { getCurrentMembership } from "@/lib/data/auth";
import { listRooms } from "@/lib/data/rooms";

const slots = Array.from({ length: 9 }, (_, index) => `${String(index + 9).padStart(2, "0")}:00`);
const malaysiaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
const today = `${malaysiaDate.find((part) => part.type === "year")?.value}-${malaysiaDate.find((part) => part.type === "month")?.value}-${malaysiaDate.find((part) => part.type === "day")?.value}`;
const formatDate = (date: string) => new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
const formatTime = (value: string) => new Intl.DateTimeFormat("en-MY", { hour: "numeric", hour12: true }).format(new Date(`1970-01-01T${value.slice(0, 5)}:00`));
const formatTimeRange = (slot: string) => {
  const [hour] = slot.split(":").map(Number);
  const endHour = hour + 1;
  const hourLabel = (value: number) => value % 12 || 12;
  const period = (value: number) => value < 12 ? "AM" : "PM";
  return period(hour) === period(endHour)
    ? `${hourLabel(hour)}–${hourLabel(endHour)} ${period(endHour)}`
    : `${hourLabel(hour)} ${period(hour)}–${hourLabel(endHour)} ${period(endHour)}`;
};

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: requestedDate } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate ?? "") ? requestedDate! : today;
  let rooms = [] as Awaited<ReturnType<typeof listRooms>>;
  let availabilitySlots = [] as Awaited<ReturnType<typeof listAvailabilitySlots>>;
  let bookings = [] as Awaited<ReturnType<typeof listTeamBookingsForDate>>;
  let loadError = false;
  const membership = await getCurrentMembership();
  const isAdmin = membership.role === "owner" || membership.role === "admin";
  try { [rooms, availabilitySlots, bookings] = await Promise.all([listRooms(), listAvailabilitySlots(date), listTeamBookingsForDate(date)]); } catch { loadError = true; }
  const bookingsAt = (roomId: string, slot: string) => {
    const [hour] = slot.split(":").map(Number);
    const slotEnd = `${String(hour + 1).padStart(2, "0")}:00`;
    return availabilitySlots
      .filter((booking) => booking.room_id === roomId && booking.start_time.slice(0, 5) < slotEnd && booking.end_time.slice(0, 5) > slot)
      .sort((first, second) => first.start_time.localeCompare(second.start_time));
  };
  const minuteOfDay = (value: string) => {
    const [hour, minute] = value.slice(0, 5).split(":").map(Number);
    return hour * 60 + minute;
  };
  const bookingPosition = (slot: string, booking: Awaited<ReturnType<typeof listAvailabilitySlots>>[number]) => {
    const [hour] = slot.split(":").map(Number);
    const slotStart = hour * 60;
    const slotEnd = slotStart + 60;
    const start = Math.max(0, ((Math.max(slotStart, minuteOfDay(booking.start_time)) - slotStart) / 60) * 100);
    const end = Math.min(100, ((Math.min(slotEnd, minuteOfDay(booking.end_time)) - slotStart) / 60) * 100);
    return { start, end };
  };
  const slotStyle = (slot: string, slotBookings: Awaited<ReturnType<typeof listAvailabilitySlots>>) => {
    let cursor = 0;
    const stops: string[] = [];
    for (const booking of slotBookings) {
      const { start, end } = bookingPosition(slot, booking);
      if (start > cursor) stops.push(`#ecfdf5 ${cursor}%`, `#ecfdf5 ${start}%`);
      stops.push(`#fff1f2 ${start}%`, `#fff1f2 ${end}%`);
      cursor = Math.max(cursor, end);
    }
    if (cursor < 100) stops.push(`#ecfdf5 ${cursor}%`, `#ecfdf5 100%`);
    return { background: `linear-gradient(90deg, ${stops.join(", ")})` };
  };

  return <main className="app-shell executive-shell">
    <header className="app-header"><div className="brand-block"><p className="eyebrow"><i /> Hi {membership.fullName}</p><p className="location">Selangor Properties · {membership.email}</p></div><div className="header-actions"><nav aria-label="Primary navigation"><Link className="active" href="/">Availability</Link>{isAdmin && <Link href="/admin">Admin console</Link>}</nav><LogoutButton /></div></header>
    <section className="hero availability-hero"><div className="hero-title"><Image src="/spsb-logo-white-red.png" width={68} height={53} alt="Selangor Properties logo" priority /><h1>Meeting Room Booking</h1></div><div className="hero-status"><span className="pulse" /> Live</div></section>
    <section className="date-bar"><div><strong>{formatDate(date)}</strong></div><DateNavigation date={date} today={today} /></section>
    {loadError ? <section className="notice error">Couldn&apos;t load availability — retry.</section> : rooms.length === 0 ? <section className="notice">No rooms configured yet.</section> : <>
      <section className="availability-card"><div className="schedule-label"><strong>Room Availability <small>(9 AM–6 PM)</small></strong></div><div className="grid-scroll"><div className="availability-grid" style={{ gridTemplateColumns: `minmax(150px, 1.1fr) repeat(${slots.length}, minmax(82px, 1fr))` }}><div className="grid-heading">Room</div>{slots.map((slot) => <div className="grid-heading time" key={slot}>{formatTimeRange(slot)}</div>)}{rooms.map((room) => <div key={room.id} className="grid-row"><div className="room-cell"><strong>{room.name}</strong><span>{room.capacity} seats</span></div>{slots.map((slot) => { const slotBookings = bookingsAt(room.id, slot); const booking = slotBookings[0]; return <div className={`slot ${booking ? "booked" : "free"}`} key={slot} style={booking ? slotStyle(slot, slotBookings) : undefined} title={booking ? slotBookings.map((entry) => `Booked by ${entry.booked_by}: ${entry.start_time.slice(0, 5)}–${entry.end_time.slice(0, 5)}`).join("\n") : "Free"}>{booking ? slotBookings.map((entry) => { const { start, end } = bookingPosition(slot, entry); const details = [`Meeting: ${entry.meeting_title}`, `Organised by: ${entry.booked_by}`, `Time: ${formatTime(entry.start_time)}–${formatTime(entry.end_time)}`, entry.attendees ? `Attendees: ${entry.attendees}` : ""].filter(Boolean).join("\n"); return <span className="booking-label" key={`${entry.booked_by}-${entry.start_time}`} style={{ left: `${start}%`, width: `${end - start}%` }} title={details}>{entry.booked_by}</span>; }) : <span>Free</span>}</div>; })}</div>)}</div></div><div className="legend"><span><i className="free-dot" /> Available</span><span><i className="booked-dot" /> Booked</span></div></section>
      <section className="content-grid"><div className="panel booking-panel"><p className="eyebrow">NEW BOOKING</p><h2>Book a meeting room</h2><p className="muted">Choose a room, time, and meeting details to reserve it.</p><BookingForm rooms={rooms} date={date} /></div><div className="panel current-bookings"><div className="panel-heading"><div><p className="eyebrow">DAILY DISPATCH</p><h2>Confirmed bookings</h2></div><span className="count-chip">{bookings.length} active</span></div>{bookings.length === 0 ? <p className="muted">There are no confirmed bookings for this date.</p> : <div className="booking-list">{bookings.map((booking) => <article key={booking.id}><div><strong>{booking.title}</strong><p>{rooms.find((room) => room.id === booking.room_id)?.name} · {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}</p><small>Organised by {booking.organiser}{booking.attendees ? ` · ${booking.attendees} attendees` : ""}</small></div>{(booking.user_id === membership.userId || isAdmin) && <CancelBooking bookingId={booking.id} />}</article>)}</div>}</div></section>
    </>}
    <nav className="mobile-nav" aria-label="Mobile navigation"><Link className="active" href="/">Availability</Link>{isAdmin && <Link href="/admin">Admin</Link>}</nav>
  </main>;
}
