"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/shared/submit-button";
import { Notice } from "@/components/ui/notice";
import { t } from "@/i18n";

import { joinSessionAction, type JoinState } from "./actions";

export function JoinForm({ code }: { code: string }) {
  const [state, action] = useActionState(async (): Promise<JoinState> => {
    try {
      return await joinSessionAction(code);
    } catch (error) {
      if (typeof error === "object" && error !== null && "digest" in error) throw error;
      return { status: "error", error: "unknown" };
    }
  }, { status: "idle" });

  const error = state.status === "error" ? state.error : null;
  const message =
    error === "full"
      ? t.join.fullDescription
      : error === "closed"
        ? t.join.closedDescription
        : error === "not_found"
          ? t.join.notFoundDescription
          : error
            ? t.join.error
            : null;

  return (
    <form action={action} className="flex flex-col gap-3">
      {message ? <Notice role="alert">{message}</Notice> : null}
      <SubmitButton size="lg" className="w-full">
        {t.join.join}
      </SubmitButton>
    </form>
  );
}
