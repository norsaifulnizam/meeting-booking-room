import { createClient } from "@/lib/supabase/server";
import type { Room } from "./types";
import { getCurrentWorkspace } from "./workspaces";

const roomOrder = ["Conference Room", "Meeting Room", "Discussion Room", "Phone Booth Room"];

export async function listRooms(): Promise<Room[]> {
  const [supabase, workspace] = await Promise.all([createClient(), getCurrentWorkspace()]);
  const { data, error } = await supabase
    .from("rooms")
    .select("id, workspace_id, name, location, capacity, facilities, is_active")
    .eq("workspace_id", workspace.id)
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return (data ?? []).sort((first, second) => {
    const firstIndex = roomOrder.indexOf(first.name);
    const secondIndex = roomOrder.indexOf(second.name);
    return (firstIndex === -1 ? roomOrder.length : firstIndex) - (secondIndex === -1 ? roomOrder.length : secondIndex);
  }) as Room[];
}