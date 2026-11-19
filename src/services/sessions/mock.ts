import type { SessionLists, SessionSummary } from "./types";

const TASHKENT_UTC_OFFSET = 5;

/** A moment `daysFromNow` days away at the given Tashkent wall-clock time, so the sample reads naturally. */
function tashkentTime(now: number, daysFromNow: number, hour: number, minute = 0) {
  const shifted = new Date(now + TASHKENT_UTC_OFFSET * 3_600_000);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate() + daysFromNow,
      hour - TASHKENT_UTC_OFFSET,
      minute,
    ),
  ).toISOString();
}

export function sampleSessions(now: number): SessionLists {
  const sessions: Omit<SessionSummary, "isHost" | "inviteCode">[] = [
    {
      id: "sample-next",
      mode: "ielts",
      status: "scheduled",
      scheduledAt: tashkentTime(now, 1, 19),
      partnerName: "Aziza",
      durationMinutes: null,
      rating: null,
    },
    {
      id: "sample-later",
      mode: "free_talk",
      status: "scheduled",
      scheduledAt: tashkentTime(now, 3, 20, 30),
      partnerName: null,
      durationMinutes: null,
      rating: null,
    },
    {
      id: "sample-last",
      mode: "free_talk",
      status: "completed",
      scheduledAt: tashkentTime(now, -1, 20, 30),
      partnerName: "Aziza",
      durationMinutes: 24,
      rating: 4,
    },
    {
      id: "sample-older",
      mode: "ielts",
      status: "completed",
      scheduledAt: tashkentTime(now, -4, 18),
      partnerName: "Jasur",
      durationMinutes: 38,
      rating: 5,
    },
    {
      id: "sample-cancelled",
      mode: "ielts",
      status: "cancelled",
      scheduledAt: tashkentTime(now, -9, 19),
      partnerName: "Jasur",
      durationMinutes: null,
      rating: null,
    },
  ];

  // Sample sessions are for viewing only: they have no invite and no room behind them.
  const viewOnly: SessionSummary[] = sessions.map((session) => ({ ...session, isHost: true, inviteCode: null }));

  return {
    upcoming: viewOnly.filter((session) => session.status === "scheduled"),
    past: viewOnly.filter((session) => session.status !== "scheduled"),
  };
}
