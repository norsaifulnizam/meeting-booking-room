"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidPassword, PasswordRequirements } from "@/components/password-requirements";

const approvedDomains = new Set([
  "menaramilenium.com.my",
  "selangorproperties.com.my",
  "spbpm.com.my",
  "thefive.com.my",
]);
const rejectedEmailMessage = "This user is not found in our system. Use an approved company email address.";

type Mode = "sign-in" | "sign-up" | "reset";

function hasApprovedDomain(value: string) {
  const [, domain] = value.trim().toLowerCase().split("@");
  return Boolean(domain) && approvedDomains.has(domain);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("sign-in");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isReset = mode === "reset";

  const switchMode = (nextMode: Mode) => { setMode(nextMode); setMessage(""); setPassword(""); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (!hasApprovedDomain(email)) { setMessage(rejectedEmailMessage); return; }
    if (mode === "sign-up" && !isValidPassword(password)) { setMessage("Your password does not meet all requirements."); return; }
    setPending(true);
    const supabase = createClient();
    const result = isReset
      ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` })
      : mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setPending(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (isReset) { setMessage("We sent a password reset link to your email. Open it to choose a new password."); return; }
    setMessage(mode === "sign-up" ? "We sent a confirmation link to your email. Open it to activate your account, then sign in." : "Signed in. Loading your workspace…");
    if (mode === "sign-in") window.location.assign("/");
  };

  const heading = isReset ? "Reset your password" : mode === "sign-up" ? "Create your account" : "Meeting Room Booking";
  const description = isReset ? "We will email a secure password reset link to your email address." : "Sign in to book and manage your rooms.";

  return <main className="login-page login-spsb"><section className="login-card">
    <div className="login-logo"><Image src="/spsb-logo-white-red.png" width={100} height={78} priority alt="Selangor Properties logo" /></div>
    <div className="login-intro"><h1>{heading}</h1><p className="company-name">Selangor Properties Sdn. Bhd.</p><p className="subtitle">{description}</p></div>
    <form onSubmit={submit} className="login-form">
      <label>Username<input type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      {!isReset && <label>Password<span className="password-field"><input type={showPassword ? "text" : "password"} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} maxLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></span></label>}
      {mode === "sign-up" && <PasswordRequirements password={password} />}
      {mode === "sign-in" && <button type="button" className="forgot-link" onClick={() => switchMode("reset")}>Forgot password?</button>}
      {message && <p className="form-message" role="status">{message}</p>}
      <button className="primary" disabled={pending}>{pending ? "Please wait…" : isReset ? "Send reset link" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
    </form>
    <div className="login-footer">
      {mode === "sign-in" && <button className="text-button" onClick={() => switchMode("sign-up")}>New user? Create an account</button>}
      {mode === "sign-up" && <button className="text-button" onClick={() => switchMode("sign-in")}>Already have an account? Sign in</button>}
      {isReset && <button className="text-button" onClick={() => switchMode("sign-in")}>Back to sign in</button>}
      <p>Need help? Contact IT Support</p>
    </div>
  </section></main>;
}