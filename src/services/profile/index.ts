import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { IS_MOCK_MODE } from "@/config/app";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/auth";
import { readMockState, writeMockState } from "@/services/mock/store";

import type { ProfileData } from "./types";

async function readSupabaseProfile(userId: string): Promise<ProfileData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, goal, level, target_band, exam_date")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    displayName: data.display_name,
    goal: data.goal,
    level: data.level,
    targetBand: data.target_band,
    examDate: data.exam_date,
  };
}

/** The signed-in user's profile, or null if they have not finished onboarding. */
export const getProfile = cache(async (): Promise<ProfileData | null> => {
  if (IS_MOCK_MODE) return (await readMockState())?.profile ?? null;

  const user = await getCurrentUser();
  return user ? readSupabaseProfile(user.id) : null;
});

/** Saves the signed-in user's profile. Returns false if it could not be saved. */
export async function saveProfile(profile: ProfileData): Promise<boolean> {
  if (IS_MOCK_MODE) {
    const state = await readMockState();
    if (!state) return false;
    await writeMockState({ ...state, profile });
    return true;
  }

  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: profile.displayName,
    goal: profile.goal,
    level: profile.level,
    target_band: profile.targetBand,
    exam_date: profile.examDate,
  });
  return !error;
}

/** For pages that need a finished account: sends anyone else to sign in or to onboarding. */
export async function requireProfile(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);

  const profile = await getProfile();
  if (!profile) redirect(`/onboarding?next=${encodeURIComponent(returnTo)}`);

  return { user, profile };
}
