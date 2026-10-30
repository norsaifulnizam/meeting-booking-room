"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INACTIVITY_LIMIT = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

export function SessionGuard() {
  const router = useRouter();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let signedOut = false;
    // Re-save any pre-existing persistent session as a browser-session cookie.
    // This takes effect for staff who were signed in before this security update.
    void createClient().auth.refreshSession();
    const signOutForInactivity = async () => {
      signedOut = true;
      await createClient().auth.signOut();
      router.replace("/login?reason=timeout");
      router.refresh();
    };
    const resetTimer = () => {
      if (signedOut) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(signOutForInactivity, INACTIVITY_LIMIT);
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [router]);

  return null;
}
