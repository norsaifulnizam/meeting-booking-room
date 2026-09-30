import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentMembership = { userId: string; email: string; workspaceId: string; role: "owner" | "admin" | "member" };

export async function getCurrentMembership(): Promise<CurrentMembership> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .single();
  if (error || !data) redirect("/login?error=membership");
  return { userId: user.id, email: user.email, workspaceId: data.workspace_id, role: data.role as CurrentMembership["role"] };
}

export async function requireAdmin(): Promise<CurrentMembership> {
  const membership = await getCurrentMembership();
  if (membership.role !== "owner" && membership.role !== "admin") redirect("/");
  return membership;
}
