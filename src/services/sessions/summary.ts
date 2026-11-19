import type { SessionError, SessionLists, SessionMode, SessionStatus, SessionSummary } from "./types";

/** After this long, a session that never started is shown as one that did not happen. */
const MISSED_AFTER_MS = 3 * 60 * 60 * 1000;

export type SessionRow = {
  id: string;
  mode: SessionMode;
  status: SessionStatus;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  is_host: boolean;
  partner_name: string | null;
  invite_code: string | null;
};

export function toSummary(row: SessionRow, now: number): SessionSummary {
  const missed = row.status === "scheduled" && Date.parse(row.scheduled_at) < now - MISSED_AFTER_MS;
  const minutes =
    row.started_at && row.ended_at
      ? Math.max(1, Math.round((Date.parse(row.ended_at) - Date.parse(row.started_at)) / 60_000))
      : null;

  return {
    id: row.id,
    mode: row.mode,
    status: missed ? "cancelled" : row.status,
    scheduledAt: row.scheduled_at,
    partnerName: row.partner_name,
    durationMinutes: minutes,
    rating: null,
    isHost: row.is_host,
    inviteCode: row.invite_code,
  };
}

/** Upcoming soonest first, past most recent first. */
export function splitSessions(sessions: SessionSummary[]): SessionLists {
  const byTime = (a: SessionSummary, b: SessionSummary) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt);
  const isUpcoming = (session: SessionSummary) => session.status === "scheduled" || session.status === "live";

  return {
    upcoming: sessions.filter(isUpcoming).sort(byTime),
    past: sessions.filter((session) => !isUpcoming(session)).sort((a, b) => byTime(b, a)),
  };
}

const KNOWN_ERRORS: SessionError[] = ["not_found", "closed", "full", "bad_time", "too_many", "no_profile"];

/** The database raises short codes as messages; anything else is reported as unknown. */
export function toSessionError(error: { message?: string } | null): SessionError {
  const message = error?.message ?? "";
  return KNOWN_ERRORS.find((code) => message === code || message.endsWith(code)) ?? "unknown";
}
