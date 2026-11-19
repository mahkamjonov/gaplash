import "server-only";

import { cookies } from "next/headers";

import { MOCK_COOKIE } from "@/config/app";
import type { ProfileData } from "@/services/profile/types";

export const MOCK_SCENARIOS = ["sample", "past_only", "empty"] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export type MockState = {
  email: string;
  profile: ProfileData | null;
  scenario: MockScenario;
};

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Mock mode keeps its pretend account in a cookie, so server code reads it the way it reads a real session. */
export async function readMockState(): Promise<MockState | null> {
  const raw = (await cookies()).get(MOCK_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as MockState;
  } catch {
    return null;
  }
}

export async function writeMockState(state: MockState) {
  (await cookies()).set(MOCK_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function clearMockState() {
  (await cookies()).delete(MOCK_COOKIE);
}
