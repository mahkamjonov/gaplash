import { describe, expect, it } from "vitest";

import { splitSessions, toSessionError, toSummary, type SessionRow } from "./summary";

const NOW = Date.parse("2026-11-17T12:00:00Z");
const hours = (h: number) => new Date(NOW + h * 3_600_000).toISOString();

const row = (overrides: Partial<SessionRow>): SessionRow => ({
  id: "s",
  mode: "ielts",
  status: "scheduled",
  scheduled_at: hours(1),
  started_at: null,
  ended_at: null,
  is_host: true,
  partner_name: null,
  invite_code: "code",
  ...overrides,
});

describe("toSummary", () => {
  it("keeps a future session scheduled", () => {
    expect(toSummary(row({}), NOW).status).toBe("scheduled");
  });

  it("keeps a session that started an hour ago scheduled, since people run late", () => {
    expect(toSummary(row({ scheduled_at: hours(-1) }), NOW).status).toBe("scheduled");
  });

  it("shows a long-past session that never started as one that did not happen", () => {
    expect(toSummary(row({ scheduled_at: hours(-4) }), NOW).status).toBe("cancelled");
  });

  it("works out the duration in whole minutes, at least one", () => {
    const done = row({ status: "completed", started_at: hours(-1), ended_at: new Date(NOW - 3_600_000 + 24.4 * 60_000).toISOString() });
    expect(toSummary(done, NOW).durationMinutes).toBe(24);
    const blink = row({ status: "completed", started_at: hours(-1), ended_at: new Date(NOW - 3_600_000 + 5_000).toISOString() });
    expect(toSummary(blink, NOW).durationMinutes).toBe(1);
  });
});

describe("splitSessions", () => {
  it("puts live and scheduled first by time, and the rest newest first", () => {
    const lists = splitSessions([
      toSummary(row({ id: "later", scheduled_at: hours(5) }), NOW),
      toSummary(row({ id: "live", status: "live", scheduled_at: hours(-0.2) }), NOW),
      toSummary(row({ id: "old", status: "completed", scheduled_at: hours(-48) }), NOW),
      toSummary(row({ id: "recent", status: "completed", scheduled_at: hours(-2) }), NOW),
      toSummary(row({ id: "missed", scheduled_at: hours(-30) }), NOW),
    ]);
    expect(lists.upcoming.map((s) => s.id)).toEqual(["live", "later"]);
    expect(lists.past.map((s) => s.id)).toEqual(["recent", "missed", "old"]);
  });
});

describe("toSessionError", () => {
  it.each([
    ["full", "full"],
    ["closed", "closed"],
    ["bad_time", "bad_time"],
    ["permission denied for function my_sessions", "unknown"],
    [undefined, "unknown"],
  ])("maps %j to %s", (message, expected) => {
    expect(toSessionError(message === undefined ? null : { message })).toBe(expected);
  });
});
