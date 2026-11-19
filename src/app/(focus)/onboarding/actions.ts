"use server";

import { safeNextPath } from "@/lib/auth/next-path";
import { saveProfile } from "@/services/profile";
import { parseProfile } from "@/services/profile/validation";

export type SaveOnboardingResult = { ok: true; redirectTo: string } | { ok: false };

export async function saveOnboardingAction(
  answers: Record<string, unknown>,
  next: unknown,
): Promise<SaveOnboardingResult> {
  const parsed = parseProfile(answers);
  if (!parsed.ok) return { ok: false };

  const saved = await saveProfile(parsed.value);
  return saved ? { ok: true, redirectTo: safeNextPath(next) } : { ok: false };
}
