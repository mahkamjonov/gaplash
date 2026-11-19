import { GOALS, LEVELS, MAX_NAME_LENGTH, type Goal, type Level, type ProfileData } from "./types";

export type ProfileValidationError = "name" | "goal" | "level" | "band" | "date";

type ParseResult = { ok: true; value: ProfileData } | { ok: false; error: ProfileValidationError };

function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Validates onboarding answers on the server. The input comes from the client, so nothing about it is trusted. */
export function parseProfile(input: Record<string, unknown>): ParseResult {
  const displayName = typeof input.displayName === "string" ? input.displayName.trim().replace(/\s+/g, " ") : "";
  if (displayName.length < 1 || displayName.length > MAX_NAME_LENGTH) return { ok: false, error: "name" };

  const goal = input.goal;
  if (!GOALS.includes(goal as Goal)) return { ok: false, error: "goal" };

  const level = input.level ?? null;
  if (level !== null && !LEVELS.includes(level as Level)) return { ok: false, error: "level" };

  // A band and an exam date mean nothing without IELTS, so they are dropped if the goal is free talk.
  const isIelts = goal === "ielts";

  const targetBand = isIelts ? (input.targetBand ?? null) : null;
  if (targetBand !== null) {
    const isHalfStep = typeof targetBand === "number" && Number.isInteger(targetBand * 2);
    if (!isHalfStep || targetBand < 1 || targetBand > 9) return { ok: false, error: "band" };
  }

  const examDate = isIelts ? input.examDate || null : null;
  if (examDate !== null && (typeof examDate !== "string" || !isValidCalendarDate(examDate))) {
    return { ok: false, error: "date" };
  }

  return {
    ok: true,
    value: {
      displayName,
      goal: goal as Goal,
      level: level as Level | null,
      targetBand: targetBand as number | null,
      examDate: examDate as string | null,
    },
  };
}
