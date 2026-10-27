"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceUserRoleAction, type ActionState } from "@/app/actions";

const initialState: ActionState = {};

export function UserRoleControl({ userId, role }: { userId: string; role: "admin" | "member" }) {
  const [state, action, pending] = useActionState(updateWorkspaceUserRoleAction, initialState);
  const router = useRouter();
  useEffect(() => { if (state.success) router.refresh(); }, [state.success, router]);

  return <form action={action} className="role-control">
    <input type="hidden" name="user_id" value={userId} />
    <select aria-label="User role" name="role" defaultValue={role}>
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
    <button className="secondary" disabled={pending}>{pending ? "Saving…" : "Save role"}</button>
    {state.error && <span className="inline-error">{state.error}</span>}
  </form>;
}
