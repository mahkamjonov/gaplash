"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APP_URL, IS_MOCK_MODE, MIN_PASSWORD_LENGTH } from "@/config/app";
import { isValidEmail, safeNextPath } from "@/lib/auth/next-path";
import { sendMagicLink, signInWithPassword, signUpWithPassword, startGoogleSignIn } from "@/services/auth";
import { signInAsMockUser } from "@/services/auth/mock";
import type { MagicLinkError, PasswordError } from "@/services/auth/types";
import { getProfile } from "@/services/profile";

export type PasswordState = { status: "idle" } | { status: "error"; error: PasswordError; email: string };

/** Signs in or signs up, then continues to the destination, or to onboarding for a new account. */
export async function passwordAction(_previous: PasswordState, formData: FormData): Promise<PasswordState> {
  const isSignUp = formData.get("intent") === "sign_up";
  const typed = String(formData.get("email") ?? "");
  const email = typed.trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email)) return { status: "error", error: "invalid_email", email: typed };
  if (!password) return { status: "error", error: "missing_password", email: typed };
  if (isSignUp && password.length < MIN_PASSWORD_LENGTH) return { status: "error", error: "weak_password", email: typed };

  const result = isSignUp ? await signUpWithPassword(email, password) : await signInWithPassword(email, password);
  if (!result.ok) return { status: "error", error: result.error, email: typed };

  const next = safeNextPath(formData.get("next"));
  const profile = await getProfile();
  redirect(profile ? next : `/onboarding?next=${encodeURIComponent(next)}`);
}

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; error: MagicLinkError; email: string };

async function callbackUrl(next: string) {
  const origin = (await headers()).get("origin") ?? APP_URL;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function sendMagicLinkAction(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const typed = String(formData.get("email") ?? "");
  const email = typed.trim().toLowerCase();
  if (!isValidEmail(email)) return { status: "error", error: "invalid_email", email: typed };

  const result = await sendMagicLink(email, await callbackUrl(safeNextPath(formData.get("next"))));
  return result.ok ? { status: "sent", email } : { status: "error", error: result.error, email: typed };
}

export async function signInWithGoogleAction(formData: FormData) {
  const url = await startGoogleSignIn(await callbackUrl(safeNextPath(formData.get("next"))));
  redirect(url ?? "/login?error=link");
}

export async function continueInMockModeAction(formData: FormData) {
  if (!IS_MOCK_MODE) redirect("/login");

  await signInAsMockUser(String(formData.get("email") ?? ""));
  redirect(`/onboarding?next=${encodeURIComponent(safeNextPath(formData.get("next")))}`);
}
