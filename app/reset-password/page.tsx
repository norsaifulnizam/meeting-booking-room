"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (password.length < 6) { setMessage("Use a password with at least 6 characters."); return; }
    if (password !== confirmation) { setMessage("The passwords do not match."); return; }
    setPending(true);
    const { error } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (error) { setMessage(error.message); return; }
    window.location.assign("/");
  };
  return <main className="login-page login-spsb"><section className="login-card"><div className="login-logo"><span>SPSB</span></div><div className="login-intro"><h1>Choose a new password</h1><p className="company-name">Selangor Properties Sdn. Bhd.</p><p className="subtitle">Set a new password to access Meeting Room Booking.</p></div><form onSubmit={submit} className="login-form"><label>New password<input type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirm password<input type="password" autoComplete="new-password" minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>{message && <p className="form-message" role="status">{message}</p>}<button className="primary" disabled={pending}>{pending ? "Saving…" : "Save new password"}</button></form></section></main>;
}
