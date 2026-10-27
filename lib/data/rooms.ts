import { createClient } from "@/lib/supabase/server";
import type { Room } from "./types";
import { getCurrentWorkspace } from "./workspaces";
import { requireAdmin } from "./auth";

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

export async function listAdminRooms(): Promise<Room[]> {
  const [supabase, membership] = await Promise.all([createClient(), requireAdmin()]);
  const { data, error } = await supabase
    .from("rooms")
    .select("id, workspace_id, name, location, capacity, facilities, is_active")
    .eq("workspace_id", membership.workspaceId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Room[];
}

export async function createRoom(input: { name: string; capacity: number; isActive: boolean }) {
  if (!input.name.trim()) throw new Error("Enter a room name.");
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 500) {
    throw new Error("Capacity must be a whole number between 1 and 500.");
  }
  const [supabase, membership] = await Promise.all([createClient(), requireAdmin()]);
  const { error } = await supabase.from("rooms").insert({
    workspace_id: membership.workspaceId,
    name: input.name.trim(),
    capacity: input.capacity,
    location: null,
    facilities: [],
    is_active: input.isActive,
  });
  if (error) throw new Error(error.message);
}

export async function updateRoom(id: string, input: { name: string; capacity: number; isActive: boolean }) {
  if (!id) throw new Error("Choose a room to update.");
  if (!input.name.trim()) throw new Error("Enter a room name.");
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 500) {
    throw new Error("Capacity must be a whole number between 1 and 500.");
  }
  const [supabase, membership] = await Promise.all([createClient(), requireAdmin()]);
  const { error } = await supabase
    .from("rooms")
    .update({ name: input.name.trim(), capacity: input.capacity, is_active: input.isActive })
    .eq("id", id)
    .eq("workspace_id", membership.workspaceId);
  if (error) throw new Error(error.message);
}
