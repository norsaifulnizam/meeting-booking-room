import Link from "next/link";
import { CancelBooking } from "@/components/cancel-booking";
import { RemoveUserAccess } from "@/components/remove-user-access";
import { RestoreUserAccess } from "@/components/restore-user-access";
import { RoomSettings } from "@/components/room-settings";
import { UserRoleControl } from "@/components/user-role-control";
import { SessionGuard } from "@/components/session-guard";
import { listUpcomingBookings, listWorkspaceUsers } from "@/lib/data/bookings";
import { getCurrentMembership } from "@/lib/data/auth";
import { listAdminRooms, listRooms } from "@/lib/data/rooms";

function formatTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${period}`;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ room?: string; tab?: string }> }) {
  const { room, tab: requestedTab } = await searchParams;
  const tab = requestedTab === "users" || requestedTab === "rooms" ? requestedTab : "bookings";
  const [rooms, adminRooms, bookings, users, membership] = await Promise.all([listRooms(), listAdminRooms(), listUpcomingBookings(room), listWorkspaceUsers(), getCurrentMembership()]);
  const confirmed = bookings.filter((booking) => booking.status === "confirmed").length;

  return <main className="app-shell executive-shell"><SessionGuard />
    <header className="app-header">
      <div className="brand-block"><p className="eyebrow"><i /> MEETING ROOMS</p><p className="location">Selangor Properties · Booking Administration</p></div>
      <nav aria-label="Primary navigation"><Link href="/">Availability</Link><Link className="active" href="/admin">Admin console</Link></nav>
    </header>
    <section className="hero">
      <div><p className="eyebrow"><i /> {tab === "bookings" ? "ROOM BOOKING MANAGEMENT" : tab === "users" ? "USER MANAGEMENT" : "ROOM SETTINGS"}</p><h1>{tab === "bookings" ? "Manage Room Bookings" : tab === "users" ? "Manage Users" : "Manage Rooms"}</h1><p className="subtitle">{tab === "bookings" ? "View and manage all upcoming room bookings." : tab === "users" ? "Manage staff access and administrator roles." : "Add rooms and control which spaces are available for booking."}</p></div>
      <div className="hero-status"><span className="pulse" /> {tab === "bookings" ? confirmed + " active" : tab === "users" ? users.filter((user) => user.is_active).length + " active users" : adminRooms.filter((room) => room.is_active).length + " available rooms"}</div>
    </section>
    <div className="admin-tabs" aria-label="Admin sections"><Link className={tab === "bookings" ? "active" : ""} href="/admin">Bookings</Link><Link className={tab === "users" ? "active" : ""} href="/admin?tab=users">User Management</Link><Link className={tab === "rooms" ? "active" : ""} href="/admin?tab=rooms">Room Settings</Link></div>
    {tab === "bookings" && <>
    <section className="date-bar">
      <div><span>Upcoming reservations</span><strong>{bookings.length} records</strong></div>
      <form><select aria-label="Filter reservations by room" name="room" defaultValue={room ?? ""}><option value="">All rooms</option>{rooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button className="secondary">Filter</button></form>
    </section>
    <section className="panel admin-panel">
      <div className="panel-heading"><div><p className="eyebrow">TEAM SCHEDULE</p><h2>Reservations</h2></div><span className="count-chip">{confirmed} confirmed</span></div>
      {bookings.length === 0 ? <p className="muted">No upcoming reservations match this filter.</p> : <div className="reservation-table">
        <div className="table-head"><span>Date & time</span><span>Room</span><span>Meeting</span><span>Booked by</span><span>Status</span><span>Action</span></div>
        {bookings.map((booking) => <div className="table-row" key={booking.id}>
          <span data-label="Date & time">{booking.booking_date}<small>{formatTime(booking.start_time)}–{formatTime(booking.end_time)}</small></span>
          <span data-label="Room">{booking.rooms?.name ?? "Unknown room"}</span>
          <span data-label="Meeting"><strong>{booking.title}</strong><small>Organiser: {booking.organiser}</small></span>
          <span data-label="Booked by" className="booking-account">{booking.booked_by_email}</span>
          <span data-label="Status" className={`status ${booking.status}`}>{booking.status}</span>
          <span data-label="Action">{booking.status === "confirmed" ? <CancelBooking bookingId={booking.id} /> : <small>{booking.cancellation_reason}</small>}</span>
        </div>)}
      </div>}
    </section>
    </>}
    {tab === "users" && <>
    <section className="panel user-management-panel">
      <div className="panel-heading"><div><p className="eyebrow">USER MANAGEMENT</p><h2>Registered users</h2><p className="muted">Deactivate staff who have left, restore access when needed, and manage administrator roles. Booking history stays available for audit.</p></div><span className="count-chip">{users.filter((user) => user.is_active).length} active</span></div>
      {users.length === 0 ? <p className="muted">No registered users found.</p> : <div className="user-directory">
        <div className="user-directory-head"><span>User</span><span>Office email</span><span>Role</span><span>Access</span></div>
        {users.map((user) => <div className="user-directory-row" key={user.user_id}>
          <span data-label="User"><strong>{user.full_name}</strong>{!user.is_active && <small className="inactive-label">Inactive</small>}</span>
          <span data-label="Office email" className="booking-account">{user.email}</span>
          <span data-label="Role">{user.user_id === membership.userId || user.role === "owner" ? <span className="role-chip">{user.role}</span> : <UserRoleControl userId={user.user_id} role={user.role === "admin" ? "admin" : "member"} />}</span>
          <span data-label="Access">{user.user_id === membership.userId || user.role === "owner" ? <small className="muted">Protected account</small> : user.is_active ? <RemoveUserAccess userId={user.user_id} email={user.email} /> : <RestoreUserAccess userId={user.user_id} />}</span>
        </div>)}
      </div>}
    </section>
    </>}
    {tab === "rooms" && <section className="panel room-management-panel">
      <div className="panel-heading"><div><p className="eyebrow">ROOM SETTINGS</p><h2>Rooms</h2><p className="muted">Turn off a room when it is unavailable. Existing booking history is kept, while inactive rooms cannot be selected for new bookings.</p></div><span className="count-chip">{adminRooms.length} rooms</span></div>
      <RoomSettings rooms={adminRooms} />
    </section>}
    <nav className="mobile-nav" aria-label="Mobile navigation"><Link href="/">Availability</Link><Link className="active" href="/admin">Admin</Link></nav>
  </main>;
}
