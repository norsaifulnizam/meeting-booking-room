import { createClient } from "@/lib/supabase/server";
import type { Booking } from "./types";
import { getCurrentWorkspace } from "./workspaces";

export type NewBooking = {
  room_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  title: string;
  organiser: string;
  attendees: string;
};

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

export async function listUpcomingBookings(roomId?: string): Promise<Booking[]> {
  const [supabase, workspace] = await Promise.all([createClient(), getCurrentWorkspace()]);
  let query = supabase
    .from("bookings")
    .select("*")
    .eq("workspace_id", workspace.id)
    .gte("booking_date", new Date().toISOString().slice(0, 10))
    .order("booking_date")
    .order("start_time");
  if (roomId) query = query.eq("room_id", roomId);
  const [{ data, error }, { data: rooms, error: roomsError }] = await Promise.all([
    query,
    supabase.from("rooms").select("id, name, location").eq("workspace_id", workspace.id),
  ]);
  if (error) throw new Error(error.message);
  if (roomsError) throw new Error(roomsError.message);
  const roomsById = new Map((rooms ?? []).map((room) => [room.id, room]));
  return (data ?? []).map((booking) => ({
    ...booking,
    rooms: roomsById.get(booking.room_id) ?? null,
  })) as Booking[];
}

export async function createBooking(input: NewBooking): Promise<Booking> {
  if (input.end_time <= input.start_time) throw new Error("End time must be after start time.");
  const [supabase, workspace] = await Promise.all([createClient(), getCurrentWorkspace()]);
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", input.room_id)
    .eq("workspace_id", workspace.id)
    .eq("is_active", true)
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error("That room is not available to this team.");
  const { data: conflicts, error: lookupError } = await supabase
    .from("bookings")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("room_id", input.room_id)
    .eq("booking_date", input.booking_date)
    .eq("status", "confirmed")
    .lt("start_time", input.end_time)
    .gt("end_time", input.start_time)
    .limit(1);
  if (lookupError) throw new Error(lookupError.message);
  if (conflicts?.length) throw new Error("Room already booked for this time.");

  const { data, error } = await supabase.from("bookings").insert({ ...input, workspace_id: workspace.id, status: "confirmed" }).select().single();
  if (error) {
    if (error.code === "23505") throw new Error("Room already booked for this time.");
    throw new Error(error.message);
  }
  return data as Booking;
}

export async function cancelBooking(id: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error("Please provide a cancellation reason.");
  const [supabase, workspace] = await Promise.all([createClient(), getCurrentWorkspace()]);
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancellation_reason: reason.trim() })
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .eq("status", "confirmed");
  if (error) throw new Error(error.message);
}
