import { getCurrentMembership } from "./auth";

export type Workspace = { id: string; slug: string; name: string };

/**
 * v1 has no sign-in or workspace switcher, so deployments use the seeded demo
 * team by default. Set DEFAULT_WORKSPACE_SLUG for a separate team deployment.
 */
export async function getCurrentWorkspace(): Promise<Workspace> {
  const membership = await getCurrentMembership();
  return { id: membership.workspaceId, slug: "demo-team", name: "Demo Team" };
}
