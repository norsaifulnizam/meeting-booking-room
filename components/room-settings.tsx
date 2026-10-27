"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRoomAction, updateRoomAction, type ActionState } from "@/app/actions";
import type { Room } from "@/lib/data/types";

const initialState: ActionState = {};

function RoomEditor({ room }: { room: Room }) {
  const [state, action, pending] = useActionState(updateRoomAction, initialState);
  const router = useRouter();
  useEffect(() => { if (state.success) router.refresh(); }, [state.success, router]);
  return <form action={action} className="room-setting-row">
    <input type="hidden" name="room_id" value={room.id} />
    <label><span>Room name</span><input name="name" defaultValue={room.name} required /></label>
    <label><span>Capacity</span><input name="capacity" type="number" min="1" max="500" defaultValue={room.capacity} required /></label>
    <label className="active-toggle"><input name="is_active" type="checkbox" defaultChecked={room.is_active} /><span>Available for booking</span></label>
    <button className="secondary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    {state.error && <span className="inline-error">{state.error}</span>}
  </form>;
}

export function RoomSettings({ rooms }: { rooms: Room[] }) {
  const [state, action, pending] = useActionState(createRoomAction, initialState);
  const router = useRouter();
  useEffect(() => { if (state.success) router.refresh(); }, [state.success, router]);
  return <>
    <form action={action} className="room-create-form">
      <label><span>New room name</span><input name="name" placeholder="e.g. Training Room" required /></label>
      <label><span>Capacity</span><input name="capacity" type="number" min="1" max="500" defaultValue="4" required /></label>
      <label className="active-toggle"><input name="is_active" type="checkbox" defaultChecked /><span>Available for booking</span></label>
      <button className="primary" disabled={pending}>{pending ? "Adding…" : "Add room"}</button>
      {state.error && <span className="inline-error">{state.error}</span>}
    </form>
    <div className="room-settings-list">
      {rooms.map((room) => <RoomEditor key={room.id} room={room} />)}
    </div>
  </>;
}
