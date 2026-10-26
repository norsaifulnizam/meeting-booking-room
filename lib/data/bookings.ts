import { createClient } from "@/lib/supabase/server";
import type { AdminBooking, Booking, WorkspaceUser } from "./types";
import { getCurrentMembership, requireAdmin } from "./auth";
import { getCurrentWorkspace } from "./workspaces";

export type BookingSlot = Pick<Booking, "room_id" | "start_time" | "end_time" | "attendees"> & { booked_by: string; meeting_title: string };

export type NewBooking = {
  room_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  title: string;
  organiser: string;
  attendees: string;
};

function malaysiaToday() {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => values.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function listBookingsForDate(date: string): Promise<Booking[]> {
  const [supabase, workspace] = await Promise.all([createClient(), getCurrentWorkspace()]);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("booking_date", date)
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as Booking[];
}

export async function listAvailabilitySlots(date: string): Promise<BookingSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("team_availability_slots", { target_date: date });
  if (error) throw new Error(error.message);
  return (data ?? []) as BookingSlot[];
}

export async function listMyBookingsForDate(date: string): Promise<Booking[]> {
  const [supabase, membership] = await Promise.all([createClient(), getCurrentMembership()]);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("workspace_id", membership.workspaceId)
    .eq("user_id", membership.userId)
    .eq("booking_date", date)
    .eq("status", "confirmed")
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as Booking[];
}

export async function listTeamBookingsForDate(date: string): Promise<Booking[]> {
  const [supabase, membership] = await Promise.all([createClient(), getCurrentMembership()]);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("workspace_id", membership.workspaceId)
    .eq("booking_date", date)
    .eq("status", "confirmed")
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as Booking[];
}

export async function listTeamBookingsForRange(startDate: string, endDate: string): Promise<Booking[]> {
  const [supabase, membership] = await Promise.all([createClient(), getCurrentMembership()]);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("workspace_id", membership.workspaceId)
    .eq("status", "confirmed")
    .gte("booking_date", startDate)
    .lte("booking_date", endDate)
    .order("booking_date")
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as Booking[];
}

export async function listUpcomingBookings(roomId?: string): Promise<AdminBooking[]> {
  const [supabase, workspace] = await Promise.all([createClient(), requireAdmin()]);
  const [{ data, error }, { data: rooms, error: roomsError }] = await Promise.all([
    supabase.rpc("admin_upcoming_bookings", { target_workspace: workspace.workspaceId, target_room: roomId ?? null }),
    supabase.from("rooms").select("id, name, location").eq("workspace_id", workspace.workspaceId),
  ]);
  if (error) throw new Error(error.message);
  if (roomsError) throw new Error(roomsError.message);
  const roomsById = new Map((rooms ?? []).map((room) => [room.id, room]));
  const adminBookings = (data ?? []) as AdminBooking[];
  return adminBookings.map((booking) => ({
    ...booking,
    rooms: roomsById.get(booking.room_id) ?? null,
  }));
}

export async function listWorkspaceUsers(): Promise<WorkspaceUser[]> {
  const [supabase, membership] = await Promise.all([createClient(), requireAdmin()]);
  const { data, error } = await supabase.rpc("workspace_user_directory", { target_workspace: membership.workspaceId });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceUser[];
}

export async function removeWorkspaceUser(userId: string) {
  const [supabase, membership] = await Promise.all([createClient(), requireAdmin()]);
  if (!userId) throw new Error("Choose a user to remove.");
  const { error } = await supabase.rpc("remove_workspace_member", {
    target_workspace: membership.workspaceId,
    target_user: userId,
  });
  if (error) throw new Error(error.message);
}

export async function createBooking(input: NewBooking): Promise<Booking> {
  if (!input.room_id || !input.booking_date || !input.start_time || !input.end_time || !input.title.trim() || !input.organiser.trim()) {
    throw new Error("Please complete the room, time, meeting title, and organiser fields.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.booking_date) || Number.isNaN(Date.parse(`${input.booking_date}T00:00:00Z`))) {
    throw new Error("Please choose a valid booking date.");
  }
  if (input.booking_date < malaysiaToday()) throw new Error("Bookings must be for today or a future date.");
  if (input.end_time <= input.start_time) throw new Error("End time must be after start time.");
  if (input.start_time < "09:00" || input.end_time > "18:00") throw new Error("Bookings are available from 9:00 AM to 6:00 PM.");
  const [supabase, membership] = await Promise.all([createClient(), getCurrentMembership()]);
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", input.room_id)
    .eq("workspace_id", membership.workspaceId)
    .eq("is_active", true)
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error("That room is not available to this team.");
  const { data: conflicts, error: lookupError } = await supabase
    .from("bookings")
    .select("id")
    .eq("workspace_id", membership.workspaceId)
    .eq("room_id", input.room_id)
    .eq("booking_date", input.booking_date)
    .eq("status", "confirmed")
    .lt("start_time", input.end_time)
    .gt("end_time", input.start_time)
    .limit(1);
  if (lookupError) throw new Error(lookupError.message);
  if (conflicts?.length) throw new Error("Room already booked for this time.");

  const { data, error } = await supabase.from("bookings").insert({ ...input, user_id: membership.userId, workspace_id: membership.workspaceId, status: "confirmed" }).select().single();
  if (error) {
    if (error.code === "23505" || error.code === "23P01") throw new Error("Room already booked for this time.");
    throw new Error(error.message);
  }
  return data as Booking;
}

export async function updateBooking(id: string, input: NewBooking): Promise<Booking> {
  if (!id || !input.room_id || !input.booking_date || !input.start_time || !input.end_time || !input.title.trim() || !input.organiser.trim()) {
    throw new Error("Please complete the room, date, time, meeting title, and organiser fields.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.booking_date) || Number.isNaN(Date.parse(`${input.booking_date}T00:00:00Z`))) {
    throw new Error("Please choose a valid booking date.");
  }
  if (input.booking_date < malaysiaToday()) throw new Error("Bookings must be for today or a future date.");
  if (input.end_time <= input.start_time) throw new Error("End time must be after start time.");
  if (input.start_time < "09:00" || input.end_time > "18:00") throw new Error("Bookings are available from 9:00 AM to 6:00 PM.");

  const [supabase, membership] = await Promise.all([createClient(), getCurrentMembership()]);
  const { data: existing, error: existingError } = await supabase
    .from("bookings")
    .select("user_id")
    .eq("id", id)
    .eq("workspace_id", membership.workspaceId)
    .eq("status", "confirmed")
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (!existing) throw new Error("This booking is no longer available to edit.");
  if (existing.user_id !== membership.userId && membership.role === "member") throw new Error("You can only edit your own bookings.");

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", input.room_id)
    .eq("workspace_id", membership.workspaceId)
    .eq("is_active", true)
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error("That room is not available to this team.");

  const { data: conflicts, error: lookupError } = await supabase
    .from("bookings")
    .select("id")
    .eq("workspace_id", membership.workspaceId)
    .eq("room_id", input.room_id)
    .eq("booking_date", input.booking_date)
    .eq("status", "confirmed")
    .neq("id", id)
    .lt("start_time", input.end_time)
    .gt("end_time", input.start_time)
    .limit(1);
  if (lookupError) throw new Error(lookupError.message);
  if (conflicts?.length) throw new Error("Room already booked for this time.");

  const { data, error } = await supabase
    .from("bookings")
    .update({ ...input, cancellation_reason: null })
    .eq("id", id)
    .eq("workspace_id", membership.workspaceId)
    .eq("status", "confirmed")
    .select()
    .single();
  if (error) {
    if (error.code === "23505" || error.code === "23P01") throw new Error("Room already booked for this time.");
    throw new Error(error.message);
  }
  return data as Booking;
}
export async function cancelBooking(id: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error("Please provide a cancellation reason.");
  const [supabase, membership] = await Promise.all([createClient(), getCurrentMembership()]);
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancellation_reason: reason.trim() })
    .eq("id", id)
    .eq("workspace_id", membership.workspaceId)
    .eq("status", "confirmed");
  if (error) throw new Error(error.message);
}
