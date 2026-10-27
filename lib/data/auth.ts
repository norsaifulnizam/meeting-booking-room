import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentMembership = { userId: string; email: string; fullName: string; workspaceId: string; role: "owner" | "admin" | "member" };

function displayName(email: string, metadata: Record<string, unknown>) {
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  if (fullName) return fullName;
  const firstName = typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const lastName = typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  const name = [firstName, lastName].filter(Boolean).join(" ");
  return name || email.split("@")[0];
}

export async function getCurrentMembership(): Promise<CurrentMembership> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, is_active")
    .eq("user_id", user.id)
    .single();
  if (error || !data || !data.is_active) redirect("/login?error=membership");
  return { userId: user.id, email: user.email, fullName: displayName(user.email, user.user_metadata), workspaceId: data.workspace_id, role: data.role as CurrentMembership["role"] };
}

export async function requireAdmin(): Promise<CurrentMembership> {
  const membership = await getCurrentMembership();
  if (membership.role !== "owner" && membership.role !== "admin") redirect("/");
  return membership;
}
