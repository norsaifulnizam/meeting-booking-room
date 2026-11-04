export type Room = {
  id: string;
  workspace_id: string;
  name: string;
  location: string | null;
  capacity: number;
  facilities: string[];
  is_active: boolean;
};

export type Booking = {
  id: string;
  workspace_id: string;
  user_id: string;
  room_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  title: string;
  organiser: string;
  attendees: string;
  status: "confirmed" | "cancelled";
  cancellation_reason: string | null;
  created_at: string;
  rooms?: Pick<Room, "name" | "location"> | null;
};

export type AdminBooking = Booking & {
  booked_by_email: string;
};

export type WorkspaceUser = {
  user_id: string;
  email: string;
  full_name: string;
  role: "owner" | "admin" | "member";
  is_active: boolean;
  joined_at: string;
};

export type BookingAuditEvent = {
  id: string;
  booking_id: string | null;
  action: "created" | "updated" | "cancelled";
  actor_email: string;
  occurred_at: string;
  room_id: string | null;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  title: string;
  organiser: string;
  cancellation_reason: string | null;
};
