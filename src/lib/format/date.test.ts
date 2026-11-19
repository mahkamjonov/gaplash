import { describe, expect, it } from "vitest";

import { formatCalendarDate, formatSessionTime } from "./date";

const TASHKENT = "Asia/Tashkent";

// 2026-11-02 15:00 in Tashkent, a Monday.
const now = new Date("2026-11-02T10:00:00Z");

describe("formatSessionTime", () => {
  it("names today, tomorrow and yesterday", () => {
    expect(formatSessionTime("2026-11-02T14:00:00Z", now, TASHKENT)).toBe("Bugun · 19:00");
    expect(formatSessionTime("2026-11-03T14:00:00Z", now, TASHKENT)).toBe("Ertaga · 19:00");
    expect(formatSessionTime("2026-11-01T15:30:00Z", now, TASHKENT)).toBe("Kecha · 20:30");
  });

  it("shows the weekday for later dates, where it helps planning, but not for past ones", () => {
    expect(formatSessionTime("2026-11-05T14:00:00Z", now, TASHKENT)).toBe("5-noyabr, payshanba · 19:00");
    expect(formatSessionTime("2026-10-24T14:00:00Z", now, TASHKENT)).toBe("24-oktabr · 19:00");
  });

  it("adds the year only when it differs", () => {
    expect(formatSessionTime("2027-01-15T14:00:00Z", now, TASHKENT)).toBe("15-yanvar 2027, juma · 19:00");
    expect(formatSessionTime("2025-12-31T14:00:00Z", now, TASHKENT)).toBe("31-dekabr 2025 · 19:00");
  });

  it("decides the day in the viewer's zone, not in UTC", () => {
    // 20:00 UTC on the 2nd is already 01:00 on the 3rd in Tashkent, and still the 2nd in New York.
    const lateUtc = "2026-11-02T20:00:00Z";
    expect(formatSessionTime(lateUtc, now, TASHKENT)).toBe("Ertaga · 01:00");
    expect(formatSessionTime(lateUtc, now, "America/New_York")).toBe("Bugun · 15:00");
  });

  it("shows midnight as 00:00", () => {
    expect(formatSessionTime("2026-11-02T19:00:00Z", now, TASHKENT)).toBe("Ertaga · 00:00");
  });
});

describe("formatCalendarDate", () => {
  it("formats without any time zone shift", () => {
    expect(formatCalendarDate("2027-01-01")).toBe("1-yanvar 2027");
    expect(formatCalendarDate("2026-12-31")).toBe("31-dekabr 2026");
  });
});
