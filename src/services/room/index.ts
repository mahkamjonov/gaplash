import "server-only";

import { IS_MOCK_MODE } from "@/config/app";
import { isUuid } from "@/lib/ids";
import type { RoomState } from "@/lib/room/types";
import { isValidRoomState } from "@/lib/room/validate";
import { createClient } from "@/lib/supabase/server";
import type { SessionMode, SessionStatus } from "@/services/sessions/types";

export type Person = { id: string; name: string };

export type RoomSnapshot = {
  sessionId: string;
  mode: SessionMode;
  status: SessionStatus;
  scheduledAt: string;
  isHost: boolean;
  me: Person;
  partner: Person | null;
  inviteCode: string | null;
  /** Null until someone opens the room for the first time. */
  state: RoomState | null;
  version: number;
  serverNow: string;
};

export type RoomUpdate = {
  applied: boolean;
  version: number;
  state: RoomState | null;
  status: SessionStatus;
  serverNow: string;
};

/** The room as the signed-in participant sees it, or null if they are not part of it. */
export async function getRoom(sessionId: string): Promise<RoomSnapshot | null> {
  if (IS_MOCK_MODE || !isUuid(sessionId)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_room", { p_session_id: sessionId });
  // Signed-out callers are refused by the database (permission denied): to them the room does not exist.
  if (error?.code === "42501") return null;
  if (error) throw error;

  const row = data[0];
  if (!row) return null;

  const participants = [row.my_id, row.partner_id].filter((id): id is string => Boolean(id));
  return {
    sessionId: row.session_id,
    mode: row.mode,
    status: row.status,
    scheduledAt: row.scheduled_at,
    isHost: row.is_host,
    me: { id: row.my_id, name: row.my_name ?? "" },
    partner: row.partner_id ? { id: row.partner_id, name: row.partner_name ?? "" } : null,
    inviteCode: row.invite_code,
    state: isValidRoomState(row.room_state, participants) ? row.room_state : null,
    version: row.room_version,
    serverNow: row.server_now,
  };
}

/** Saves the room's state if nobody changed it first. Returns null if the session is closed or not theirs. */
export async function updateRoom(
  sessionId: string,
  expectedVersion: number,
  state: RoomState,
  status: "live" | "completed" | null,
): Promise<RoomUpdate | null> {
  if (IS_MOCK_MODE) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_room", {
    p_session_id: sessionId,
    p_expected_version: expectedVersion,
    p_state: state,
    p_status: status,
  });
  if (error) return null;

  const row = data[0];
  return row
    ? {
        applied: row.applied,
        version: row.room_version,
        state: row.room_state as RoomState | null,
        status: row.status,
        serverNow: row.server_now,
      }
    : null;
}
