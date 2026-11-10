"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setWorkspaceUserPasswordAction, type ActionState } from "@/app/actions";
import { PasswordRequirements } from "@/components/password-requirements";

const initialState: ActionState = {};

export function SetUserPassword({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notice, setNotice] = useState("");
  const [state, action, pending] = useActionState(setWorkspaceUserPasswordAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setPassword("");
      setConfirmation("");
      setOpen(false);
      setNotice(state.success);
      router.refresh();
    }
  }, [state.success, router]);

  if (!open) return <div className="password-control"><button type="button" className="secondary" onClick={() => { setNotice(""); setOpen(true); }}>Set new password</button>{notice && <span className="inline-success">{notice}</span>}</div>;

  return <form action={action} className="password-admin-form" onSubmit={(event) => {
    if (!window.confirm(`Set a new password for ${email}? Their current password will stop working immediately.`)) event.preventDefault();
  }}>
    <input type="hidden" name="user_id" value={userId} />
    <label>New password<span className="password-input"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? "Hide" : "Show"}</button></span></label>
    <PasswordRequirements password={password} />
    <label>Confirm password<span className="password-input"><input name="confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /><button type="button" onClick={() => setShowConfirmation((shown) => !shown)}>{showConfirmation ? "Hide" : "Show"}</button></span></label>
    <div className="password-admin-actions"><button className="secondary" disabled={pending}>{pending ? "Saving…" : "Save password"}</button><button type="button" className="text-button" onClick={() => setOpen(false)}>Cancel</button></div>
    {state.success && <span className="inline-success">{state.success}</span>}
    {state.error && <span className="inline-error">{state.error}</span>}
  </form>;
}
