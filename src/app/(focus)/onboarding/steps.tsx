"use client";

import { useSyncExternalStore, type ReactNode, type RefCallback } from "react";
import { GraduationCap, MessageCircle, ShieldCheck } from "lucide-react";

import { ChoiceCard, ChoiceChip } from "@/components/ui/choice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/i18n";
import { LEVELS, MAX_NAME_LENGTH, TARGET_BANDS, type Goal, type Level } from "@/services/profile/types";

export type Draft = {
  displayName: string;
  goal: Goal | null;
  level: Level | null;
  targetBand: number | null;
  examDate: string;
};

type StepProps = {
  draft: Draft;
  update: (changes: Partial<Draft>) => void;
  error: string | null;
  headingRef: RefCallback<HTMLHeadingElement>;
};

function StepHeader({
  title,
  hint,
  headingRef,
}: {
  title: string;
  hint: ReactNode;
  headingRef: RefCallback<HTMLHeadingElement>;
}) {
  return (
    <header className="flex flex-col gap-2">
      <h1 ref={headingRef} tabIndex={-1} className="text-title text-balance outline-none">
        {title}
      </h1>
      <p className="text-body text-muted-foreground">{hint}</p>
    </header>
  );
}

function StepError({ id, children }: { id?: string; children: string | null }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-small text-warm-ink">
      {children}
    </p>
  );
}

export function NameStep({ draft, update, error, headingRef, showRule }: StepProps & { showRule: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title={t.onboarding.nameTitle} hint={t.onboarding.nameHint} headingRef={headingRef} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">{t.onboarding.nameLabel}</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="given-name"
          maxLength={MAX_NAME_LENGTH}
          placeholder={t.onboarding.namePlaceholder}
          value={draft.displayName}
          onChange={(event) => update({ displayName: event.target.value })}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "displayName-error" : undefined}
        />
        <StepError id="displayName-error">{error}</StepError>
      </div>
      {showRule ? (
        <aside className="flex items-start gap-3 rounded-card bg-primary-tint p-4">
          <ShieldCheck aria-hidden className="size-6 shrink-0 text-primary-ink" />
          <div className="flex flex-col gap-1">
            <h2 className="text-body font-semibold text-pretty">{t.onboarding.ruleTitle}</h2>
            <p className="text-small text-foreground">{t.onboarding.ruleBody}</p>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

export function GoalStep({ draft, update, error, headingRef }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title={t.onboarding.goalTitle} hint={t.onboarding.goalHint} headingRef={headingRef} />
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t.onboarding.goalTitle}</legend>
        <ChoiceCard
          name="goal"
          value="ielts"
          icon={GraduationCap}
          title={t.modes.ielts}
          description={t.onboarding.goalIeltsDescription}
          checked={draft.goal === "ielts"}
          onChange={() => update({ goal: "ielts" })}
        />
        <ChoiceCard
          name="goal"
          value="free_talk"
          icon={MessageCircle}
          title={t.modes.free_talk}
          description={t.onboarding.goalFreeDescription}
          checked={draft.goal === "free_talk"}
          onChange={() => update({ goal: "free_talk" })}
        />
      </fieldset>
      <StepError>{error}</StepError>
    </div>
  );
}

export function LevelStep({ draft, update, headingRef }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title={t.onboarding.levelTitle} hint={t.onboarding.levelHint} headingRef={headingRef} />
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t.onboarding.levelTitle}</legend>
        {LEVELS.map((level) => (
          <ChoiceCard
            key={level}
            name="level"
            value={level}
            title={level}
            description={t.onboarding.levels[level]}
            checked={draft.level === level}
            onChange={() => update({ level })}
          />
        ))}
      </fieldset>
    </div>
  );
}

const subscribeToNothing = () => () => {};

/** Today in the viewer's time zone, known only in the browser. The server renders without the limit. */
function useToday() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => {
      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, "0");
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    },
    () => undefined,
  );
}

export function TargetStep({ draft, update, headingRef }: StepProps) {
  const today = useToday();

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title={t.onboarding.targetTitle} hint={t.onboarding.targetHint} headingRef={headingRef} />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 block text-small font-semibold">{t.onboarding.bandLabel}</legend>
        <div className="grid grid-cols-3 gap-2">
          {TARGET_BANDS.map((band) => (
            <ChoiceChip
              key={band}
              name="targetBand"
              value={band}
              checked={draft.targetBand === band}
              // Clicking the chosen chip again clears it, because this answer is optional.
              onClick={() => draft.targetBand === band && update({ targetBand: null })}
              onChange={() => update({ targetBand: band })}
            >
              <span className="tabular-nums">{band.toFixed(1)}</span>
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="examDate">{t.onboarding.examLabel}</Label>
        <Input
          id="examDate"
          name="examDate"
          type="date"
          min={today}
          value={draft.examDate}
          onChange={(event) => update({ examDate: event.target.value })}
          className="appearance-none"
        />
      </div>
    </div>
  );
}
