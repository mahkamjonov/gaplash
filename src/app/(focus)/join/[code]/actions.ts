"use server";

import { redirect } from "next/navigation";

import { joinSession } from "@/services/sessions";
import type { SessionError } from "@/services/sessions/types";

export type JoinState = { status: "idle" } | { status: "error"; error: SessionError };

export async function joinSessionAction(code: string): Promise<JoinState> {
  const result = await joinSession(code);
  if (!result.ok) return { status: "error", error: result.error };

  redirect(`/room/${result.value}`);
}
