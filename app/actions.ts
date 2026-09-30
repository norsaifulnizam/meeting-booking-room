"use server";

import { revalidatePath } from "next/cache";
import { cancelBooking, createBooking } from "@/lib/data/bookings";

export type ActionState = { error?: string; success?: string };

export async function createBookingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await createBooking({
      room_id: String(formData.get("room_id") ?? ""),
      booking_date: String(formData.get("booking_date") ?? ""),
      start_time: String(formData.get("start_time") ?? ""),
      end_time: String(formData.get("end_time") ?? ""),
      title: String(formData.get("title") ?? "").trim(),
      organiser: String(formData.get("organiser") ?? "").trim(),
      attendees: String(formData.get("attendees") ?? "").trim(),
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: "Booking confirmed. The availability grid has been updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't create the booking." };
  }
}

export async function cancelBookingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await cancelBooking(String(formData.get("booking_id") ?? ""), String(formData.get("reason") ?? ""));
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: "Booking cancelled. The room is free again." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't cancel the booking." };
  }
}
