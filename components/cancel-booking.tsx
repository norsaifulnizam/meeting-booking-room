"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cancelBookingAction, type ActionState } from "@/app/actions";
const initialState: ActionState = {};

export function CancelBooking({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(cancelBookingAction, initialState);
  const router = useRouter();
  useEffect(() => { if (state.success) router.refresh(); }, [state.success, router]);
  return <form action={action} className="cancel-form"><input type="hidden" name="booking_id" value={bookingId} /><label className="sr-only">Cancellation reason</label><input name="reason" required placeholder="Cancellation reason" /><button className="secondary" disabled={pending}>{pending ? "Cancelling…" : "Cancel"}</button>{state.error && <span className="inline-error">{state.error}</span>}</form>;
}
