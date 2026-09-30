"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const officeDomain = "@selangorproperties.com.my";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (!email.toLowerCase().endsWith(officeDomain)) { setMessage("Use your @selangorproperties.com.my office email."); return; }
    setPending(true);
    const supabase = createClient();
    const result = mode === "sign-in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setPending(false);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(mode === "sign-up" ? "Check your office inbox to confirm your account, then sign in." : "Signed in. Loading your workspace…");
    if (mode === "sign-in") window.location.assign("/");
  };
  return <main className="login-page"><section className="login-card"><p className="eyebrow"><i /> MEETING ROOMS</p><h1>{mode === "sign-in" ? "Welcome back." : "Create your workspace account."}</h1><p className="subtitle">Use your Selangor Properties office email to access the team room schedule.</p><form onSubmit={submit} className="login-form"><label>Office email<input type="email" autoComplete="email" placeholder="name@selangorproperties.com.my" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{message && <p className="form-message">{message}</p>}<button className="primary" disabled={pending}>{pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</button></form><button className="text-button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>{mode === "sign-in" ? "New here? Create an office account" : "Already have an account? Sign in"}</button></section></main>;
}
