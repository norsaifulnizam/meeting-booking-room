"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { restoreWorkspaceUserAction, type ActionState } from "@/app/actions";

const initialState: ActionState = {};

export function RestoreUserAccess({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(restoreWorkspaceUserAction, initialState);
  const router = useRouter();
  useEffect(() => { if (state.success) router.refresh(); }, [state.success, router]);

  return <form action={action} className="remove-user-form">
    <input type="hidden" name="user_id" value={userId} />
    <button className="secondary restore-access" disabled={pending}>{pending ? "Restoring…" : "Restore access"}</button>
    {state.error && <span className="inline-error">{state.error}</span>}
  </form>;
}
