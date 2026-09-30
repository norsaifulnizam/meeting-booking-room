export type Room = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  facilities: string[];
  is_active: boolean;
};

export type Booking = {
  id: string;
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
