export const GOALS = ["ielts", "free_talk"] as const;
export type Goal = (typeof GOALS)[number];

export const LEVELS = ["A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];

export const TARGET_BANDS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9] as const;

export const MAX_NAME_LENGTH = 40;

export type ProfileData = {
  displayName: string;
  goal: Goal;
  level: Level | null;
  targetBand: number | null;
  /** A calendar date as YYYY-MM-DD, with no time zone. */
  examDate: string | null;
};
