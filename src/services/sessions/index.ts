import "server-only";

import { cache } from "react";

import { IS_MOCK_MODE } from "@/config/app";
import { requestNow } from "@/lib/format/request-time";
import { isInviteCode, isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import { readMockState } from "@/services/mock/store";

import { sampleSessions } from "./mock";
import { splitSessions, toSessionError, toSummary } from "./summary";
import type { InvitePreview, SessionError, SessionLists, SessionMode, SessionSummary } from "./types";

const NO_SESSIONS: SessionLists = { upcoming: [], past: [] };

/** The signed-in user's sessions, soonest upcoming first and most recent past first. */
export const listSessions = cache(async (): Promise<SessionLists> => {
  if (IS_MOCK_MODE) {
    const state = await readMockState();
    if (!state || state.scenario === "empty") return NO_SESSIONS;

    const sample = sampleSessions((await requestNow()).getTime());
    return state.scenario === "past_only" ? { upcoming: [], past: sample.past } : sample;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_sessions");
  if (error) throw error;

  const now = (await requestNow()).getTime();
  return splitSessions(data.map((row) => toSummary(row, now)));
});

export async function getSession(id: string): Promise<SessionSummary | null> {
  const { upcoming, past } = await listSessions();
  return [...upcoming, ...past].find((session) => session.id === id) ?? null;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: SessionError };

/** Starts a session now, or at `scheduledAt`. Real accounts only: mock mode has no backend to share. */
export async function createSession(mode: SessionMode, scheduledAt: string | null): Promise<Result<string>> {
  if (IS_MOCK_MODE) return { ok: false, error: "unavailable" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_session", { p_mode: mode, p_scheduled_at: scheduledAt });
  return error ? { ok: false, error: toSessionError(error) } : { ok: true, value: data.id };
}

export async function getInvite(code: string): Promise<InvitePreview | null> {
  if (IS_MOCK_MODE || !isInviteCode(code)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invite", { p_code: code });
  if (error) throw error;

  const row = data[0];
  return row
    ? {
        sessionId: row.session_id,
        mode: row.mode,
        status: row.status,
        scheduledAt: row.scheduled_at,
        hostName: row.host_name,
        isHost: row.is_host,
        isGuest: row.is_guest,
        isFull: row.is_full,
      }
    : null;
}

export async function joinSession(code: string): Promise<Result<string>> {
  if (IS_MOCK_MODE) return { ok: false, error: "unavailable" };
  if (!isInviteCode(code)) return { ok: false, error: "not_found" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_session", { p_code: code });
  return error ? { ok: false, error: toSessionError(error) } : { ok: true, value: data };
}

export async function cancelSession(id: string): Promise<boolean> {
  if (IS_MOCK_MODE || !isUuid(id)) return false;

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_session", { p_session_id: id });
  return !error;
}
