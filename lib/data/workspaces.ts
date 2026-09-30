import { createClient } from "@/lib/supabase/server";

export type Workspace = { id: string; slug: string; name: string };

/**
 * v1 has no sign-in or workspace switcher, so deployments use the seeded demo
 * team by default. Set DEFAULT_WORKSPACE_SLUG for a separate team deployment.
 */
export async function getCurrentWorkspace(): Promise<Workspace> {
  const supabase = await createClient();
  const slug = process.env.DEFAULT_WORKSPACE_SLUG ?? "demo-team";
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error("The selected team workspace could not be loaded.");
  }
  return data as Workspace;
}
