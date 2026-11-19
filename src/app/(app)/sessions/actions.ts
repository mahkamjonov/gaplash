"use server";

import { redirect } from "next/navigation";

import { cancelSession, createSession } from "@/services/sessions";
import type { SessionError } from "@/services/sessions/types";

export type CreateSessionState = { status: "idle" } | { status: "error"; error: SessionError };

export async function createSessionAction(_previous: CreateSessionState, formData: FormData): Promise<CreateSessionState> {
  const mode = formData.get("mode");
  if (mode !== "ielts" && mode !== "free_talk") return { status: "error", error: "unknown" };

  // "Later" sends a full ISO time worked out in the browser, so the user's own time zone is respected.
  const when = formData.get("when");
  const scheduledAt = when === "later" ? String(formData.get("scheduledAt") ?? "") : null;
  if (scheduledAt !== null && Number.isNaN(Date.parse(scheduledAt))) return { status: "error", error: "bad_time" };

  const result = await createSession(mode, scheduledAt ? new Date(scheduledAt).toISOString() : null);
  if (!result.ok) return { status: "error", error: result.error };

  redirect(`/sessions/${result.value}`);
}

export async function cancelSessionAction(sessionId: string): Promise<boolean> {
  return cancelSession(sessionId);
}
