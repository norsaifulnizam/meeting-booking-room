import { createClient } from "@/lib/supabase/server";
import type { Room } from "./types";
import { getCurrentWorkspace } from "./workspaces";

export async function listRooms(): Promise<Room[]> {
  const [supabase, workspace] = await Promise.all([createClient(), getCurrentWorkspace()]);
  const { data, error } = await supabase
    .from("rooms")
    .select("id, workspace_id, name, location, capacity, facilities, is_active")
    .eq("workspace_id", workspace.id)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Room[];
}
