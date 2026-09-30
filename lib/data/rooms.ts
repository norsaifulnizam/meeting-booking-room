import { createClient } from "@/lib/supabase/server";
import type { Room } from "./types";

export async function listRooms(): Promise<Room[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, location, capacity, facilities, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Room[];
}
