"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspaceUserAction, type ActionState } from "@/app/actions";
import { PasswordRequirements } from "@/components/password-requirements";

const initialState: ActionState = {};

export function CreateWorkspaceUser() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [state, action, pending] = useActionState(createWorkspaceUserAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setPassword("");
      setOpen(false);
      setNotice(state.success);
      router.refresh();
    }
  }, [state.success, router]);

  if (!open) return <div className="create-user-toggle"><button className="primary" type="button" onClick={() => { setNotice(""); setOpen(true); }}>Create staff account</button>{notice && <span className="inline-success">{notice}</span>}</div>;

  return <form action={action} className="create-user-form">
    <div className="create-user-heading"><div><p className="eyebrow">NEW STAFF ACCOUNT</p><h3>Create staff account</h3><p className="muted">The user can sign in immediately. No confirmation email is sent.</p></div></div>
    <div className="field-row"><label>First name<input name="first_name" autoComplete="given-name" required /></label><label>Last name<input name="last_name" autoComplete="family-name" required /></label></div>
    <label>Office email<input name="email" type="email" autoComplete="email" placeholder="name@company.com" required /></label>
    <div className="field-row"><label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={12} required /></label></div>
    <PasswordRequirements password={password} />
    <div className="create-user-actions"><button className="primary" disabled={pending}>{pending ? "Creating…" : "Create account"}</button><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button></div>
    {state.error && <span className="inline-error">{state.error}</span>}
  </form>;
}
