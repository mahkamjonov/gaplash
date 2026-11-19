export type SessionMode = "ielts" | "free_talk";

export type SessionStatus = "scheduled" | "live" | "completed" | "cancelled";

export type SessionSummary = {
  id: string;
  mode: SessionMode;
  /** A scheduled session that never started counts as cancelled once its time is well past. */
  status: SessionStatus;
  /** An ISO timestamp. Shown in the viewer's own time zone. */
  scheduledAt: string;
  partnerName: string | null;
  durationMinutes: number | null;
  /** The viewer's own answer to "Was this useful?", from 1 to 5. */
  rating: number | null;
  isHost: boolean;
  /** For the host only, to invite a partner. */
  inviteCode: string | null;
};

export type SessionLists = {
  upcoming: SessionSummary[];
  past: SessionSummary[];
};

export type SessionError = "not_found" | "closed" | "full" | "bad_time" | "too_many" | "no_profile" | "unavailable" | "unknown";

export type InvitePreview = {
  sessionId: string;
  mode: SessionMode;
  status: SessionStatus;
  scheduledAt: string;
  hostName: string | null;
  isHost: boolean;
  isGuest: boolean;
  isFull: boolean;
};
