"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { CalendarClock, GraduationCap, MessageCircle, Zap } from "lucide-react";

import { SubmitButton } from "@/components/shared/submit-button";
import { ChoiceCard } from "@/components/ui/choice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { t } from "@/i18n";
import type { SessionMode } from "@/services/sessions/types";

import { createSessionAction, type CreateSessionState } from "../actions";

const subscribeToNothing = () => () => {};
const pad = (value: number) => String(value).padStart(2, "0");
const toLocalInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** The browser's local time as a datetime-local value; unknown on the server. */
function useLocalNow() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => toLocalInput(new Date(Math.floor(Date.now() / 60_000) * 60_000)),
    () => undefined,
  );
}

function nextFullHour(now: string | undefined) {
  if (!now) return "";
  const date = new Date(now);
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return toLocalInput(date);
}

async function createSafely(previous: CreateSessionState, formData: FormData): Promise<CreateSessionState> {
  try {
    return await createSessionAction(previous, formData);
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    return { status: "error", error: "unknown" };
  }
}

export function NewSessionForm({ defaultMode }: { defaultMode: SessionMode }) {
  const [state, action] = useActionState(createSafely, { status: "idle" } satisfies CreateSessionState);
  const [mode, setMode] = useState<SessionMode>(defaultMode);
  const [when, setWhen] = useState<"now" | "later">("now");
  const now = useLocalNow();
  const [localTime, setLocalTime] = useState<string | null>(null);
  const chosenTime = localTime ?? nextFullHour(now);

  const error = state.status === "error" ? state.error : null;
  const createError = error === "bad_time" || error === "too_many" || error === "unavailable" ? error : error ? "unknown" : null;

  return (
    <form action={action} className="flex max-w-xl flex-col gap-8">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="when" value={when} />
      <input type="hidden" name="scheduledAt" value={chosenTime ? new Date(chosenTime).toISOString() : ""} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-subheading">{t.sessions.modeLabel}</legend>
        <ChoiceCard
          name="mode-choice"
          value="ielts"
          icon={GraduationCap}
          title={t.modes.ielts}
          description={t.onboarding.goalIeltsDescription}
          checked={mode === "ielts"}
          onChange={() => setMode("ielts")}
        />
        <ChoiceCard
          name="mode-choice"
          value="free_talk"
          icon={MessageCircle}
          title={t.modes.free_talk}
          description={t.onboarding.goalFreeDescription}
          checked={mode === "free_talk"}
          onChange={() => setMode("free_talk")}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-subheading">{t.sessions.whenLabel}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ChoiceCard
            name="when-choice"
            value="now"
            icon={Zap}
            title={t.sessions.now}
            checked={when === "now"}
            onChange={() => setWhen("now")}
          />
          <ChoiceCard
            name="when-choice"
            value="later"
            icon={CalendarClock}
            title={t.sessions.later}
            checked={when === "later"}
            onChange={() => setWhen("later")}
          />
        </div>
        {when === "later" ? (
          <div className="flex flex-col gap-2 pt-2">
            <Label htmlFor="scheduledAtLocal">{t.sessions.dateTimeLabel}</Label>
            <Input
              id="scheduledAtLocal"
              type="datetime-local"
              min={now}
              required
              value={chosenTime}
              onChange={(event) => setLocalTime(event.target.value)}
              className="appearance-none"
            />
          </div>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-3">
        {createError ? <Notice role="alert">{t.sessions.createErrors[createError]}</Notice> : null}
        <SubmitButton className="w-full sm:w-auto sm:self-start">{t.sessions.create}</SubmitButton>
      </div>
    </form>
  );
}
