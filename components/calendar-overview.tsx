import Link from "next/link";
import type { Booking, Room } from "@/lib/data/types";

type CalendarView = "week" | "month";

const parseDate = (value: string) => new Date(value + "T00:00:00");
const toDateKey = (value: Date) => [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};
const weekStart = (value: string) => {
  const date = parseDate(value);
  return addDays(date, -((date.getDay() + 6) % 7));
};
const shortDate = (value: Date) => new Intl.DateTimeFormat("en-MY", { weekday: "short", day: "numeric", month: "short" }).format(value);
const monthName = (value: Date) => new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(value);
const formatTime = (value: string) => {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  return String(hour % 12 || 12) + (minute ? ":" + String(minute).padStart(2, "0") : "") + (hour >= 12 ? " PM" : " AM");
};

export function calendarRange(view: CalendarView, date: string) {
  if (view === "week") {
    const start = weekStart(date);
    return { start: toDateKey(start), end: toDateKey(addDays(start, 6)) };
  }
  const selected = parseDate(date);
  return {
    start: toDateKey(new Date(selected.getFullYear(), selected.getMonth(), 1)),
    end: toDateKey(new Date(selected.getFullYear(), selected.getMonth() + 1, 0)),
  };
}

export function CalendarOverview({ view, date, rooms, bookings }: { view: CalendarView; date: string; rooms: Room[]; bookings: Booking[] }) {
  const bookingTooltip = (items: Booking[]) => items.map((booking) => booking.title + ": " + formatTime(booking.start_time) + "–" + formatTime(booking.end_time)).join("\n");

  if (view === "week") {
    const start = weekStart(date);
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
    return <section className="availability-card overview-card">
      <div className="schedule-label"><strong>Weekly availability <small>{shortDate(start)} – {shortDate(days[6])}</small></strong><span>Click a day for details</span></div>
      <div className="grid-scroll"><div className="week-overview">
        <div className="overview-heading room-heading">Room</div>{days.map((day) => <div className="overview-heading" key={toDateKey(day)}>{shortDate(day)}</div>)}
        {rooms.map((room) => <div className="overview-row" key={room.id}><div className="overview-room"><strong>{room.name}</strong><span>{room.capacity} seats</span></div>{days.map((day) => {
          const dayKey = toDateKey(day);
          const dayBookings = bookings.filter((booking) => booking.room_id === room.id && booking.booking_date === dayKey);
          return <Link className={"overview-slot " + (dayBookings.length ? "booked" : "free")} href={"/?date=" + dayKey} key={dayKey} title={dayBookings.length ? bookingTooltip(dayBookings) : "Free"}>{dayBookings.length ? <><strong>{dayBookings.length}</strong><span>{dayBookings.length === 1 ? "booking" : "bookings"}</span></> : <span>Free</span>}</Link>;
        })}</div>)}
      </div></div>
      <div className="legend"><span><i className="free-dot" /> Available</span><span><i className="booked-dot" /> Has bookings</span></div>
    </section>;
  }

  const selected = parseDate(date);
  const firstOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const firstGridDay = addDays(firstOfMonth, -((firstOfMonth.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => addDays(firstGridDay, index));
  return <section className="availability-card overview-card">
    <div className="schedule-label"><strong>Monthly availability <small>{monthName(selected)}</small></strong><span>Click a day for details</span></div>
    <div className="month-calendar">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => <div className="month-heading" key={label}>{label}</div>)}
      {days.map((day) => {
        const dayKey = toDateKey(day);
        const count = bookings.filter((booking) => booking.booking_date === dayKey).length;
        const inMonth = day.getMonth() === selected.getMonth();
        return <Link className={"month-day " + (count ? "booked " : "free ") + (inMonth ? "" : "outside-month")} href={"/?date=" + dayKey} key={dayKey} title={count ? String(count) + (count === 1 ? " booking" : " bookings") : "Free"}><strong>{day.getDate()}</strong><span>{count ? String(count) + (count === 1 ? " booking" : " bookings") : "Free"}</span></Link>;
      })}
    </div>
    <div className="legend"><span><i className="free-dot" /> No bookings</span><span><i className="booked-dot" /> Has bookings</span></div>
  </section>;
}
