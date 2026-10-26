"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { removeWorkspaceUserAction, type ActionState } from "@/app/actions";

const initialState: ActionState = {};

export function RemoveUserAccess({ userId, email }: { userId: string; email: string }) {
  const [state, action, pending] = useActionState(removeWorkspaceUserAction, initialState);
  const router = useRouter();
  useEffect(() => { if (state.success) router.refresh(); }, [state.success, router]);

  return <form action={action} className="remove-user-form" onSubmit={(event) => {
    if (!window.confirm(`Remove ${email}'s access to Meeting Room Booking? Their booking history will be kept.`)) event.preventDefault();
  }}>
    <input type="hidden" name="user_id" value={userId} />
    <button className="secondary remove-access" disabled={pending}>{pending ? "Removing…" : "Remove access"}</button>
    {state.error && <span className="inline-error">{state.error}</span>}
  </form>;
}
