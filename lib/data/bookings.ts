import { createClient } from "@/lib/supabase/server";
import type { Booking } from "./types";

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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_date", date)
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as Booking[];
}

export async function listUpcomingBookings(roomId?: string): Promise<Booking[]> {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("*, rooms(name, location)")
    .gte("booking_date", new Date().toISOString().slice(0, 10))
    .order("booking_date")
    .order("start_time");
  if (roomId) query = query.eq("room_id", roomId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Booking[];
}

export async function createBooking(input: NewBooking): Promise<Booking> {
  if (input.end_time <= input.start_time) throw new Error("End time must be after start time.");
  const supabase = await createClient();
  const { data: conflicts, error: lookupError } = await supabase
    .from("bookings")
    .select("id")
    .eq("room_id", input.room_id)
    .eq("booking_date", input.booking_date)
    .eq("status", "confirmed")
    .lt("start_time", input.end_time)
    .gt("end_time", input.start_time)
    .limit(1);
  if (lookupError) throw new Error(lookupError.message);
  if (conflicts?.length) throw new Error("Room already booked for this time.");

  const { data, error } = await supabase.from("bookings").insert({ ...input, status: "confirmed" }).select().single();
  if (error) {
    if (error.code === "23505") throw new Error("Room already booked for this time.");
    throw new Error(error.message);
  }
  return data as Booking;
}

export async function cancelBooking(id: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error("Please provide a cancellation reason.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancellation_reason: reason.trim() })
    .eq("id", id)
    .eq("status", "confirmed");
  if (error) throw new Error(error.message);
}
