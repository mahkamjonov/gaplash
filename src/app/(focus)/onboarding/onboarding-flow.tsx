"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

import { saveOnboardingAction } from "./actions";
import { GoalStep, LevelStep, NameStep, TargetStep, type Draft } from "./steps";

type Step = "name" | "goal" | "level" | "target";

const IELTS_STEPS: Step[] = ["name", "goal", "level", "target"];
const FREE_TALK_STEPS: Step[] = ["name", "goal", "level"];
const OPTIONAL_STEPS: Step[] = ["level", "target"];

type OnboardingFlowProps = {
  initial: Draft;
  next: string;
  /** Changing answers from the profile page, rather than signing up for the first time. */
  editing: boolean;
};

export function OnboardingFlow({ initial, next, editing }: OnboardingFlowProps) {
  const router = useRouter();
  const hasNavigated = useRef(false);
  const reduceMotion = useReducedMotion();
  const slide = reduceMotion ? 0 : 16;

  const [draft, setDraft] = useState(initial);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const steps = draft.goal === "free_talk" ? FREE_TALK_STEPS : IELTS_STEPS;
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  // Moves screen-reader and keyboard users to each new question as it appears, but not on first load.
  const focusNewHeading = useCallback((heading: HTMLHeadingElement | null) => {
    if (heading && hasNavigated.current) heading.focus({ preventScroll: true });
  }, []);

  function update(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
    setStepError(null);
  }

  function goTo(index: number) {
    hasNavigated.current = true;
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
    setStepError(null);
    setSaveFailed(false);
  }

  function save(answers: Draft) {
    setSaveFailed(false);
    startSaving(async () => {
      try {
        const result = await saveOnboardingAction(answers, next);
        if (result.ok) router.replace(result.redirectTo);
        else setSaveFailed(true);
      } catch {
        setSaveFailed(true);
      }
    });
  }

  function advance() {
    if (step === "name" && !draft.displayName.trim()) {
      setStepError(t.onboarding.nameError);
      return;
    }
    if (step === "goal" && !draft.goal) {
      setStepError(t.onboarding.goalError);
      return;
    }
    if (isLastStep) save(draft);
    else goTo(stepIndex + 1);
  }

  function skip() {
    const cleared = step === "level" ? { level: null } : { targetBand: null, examDate: "" };
    const answers = { ...draft, ...cleared };
    setDraft(answers);
    if (isLastStep) save(answers);
    else goTo(stepIndex + 1);
  }

  const stepProps = { draft, update, error: stepError, headingRef: focusNewHeading };

  return (
    <LazyMotion features={domAnimation} strict>
      <form
        noValidate
        className="flex flex-1 flex-col gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          advance();
        }}
      >
        <div className="flex items-center gap-3">
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t.common.back}
              className="-ml-2"
              onClick={() => goTo(stepIndex - 1)}
            >
              <ArrowLeft />
            </Button>
          ) : editing ? (
            <Button asChild variant="ghost" size="icon-sm" className="-ml-2">
              <Link href="/profile" aria-label={t.common.back}>
                <ArrowLeft />
              </Link>
            </Button>
          ) : null}
          <div
            role="progressbar"
            aria-label={t.onboarding.progress(stepIndex + 1, steps.length)}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={stepIndex + 1}
            className="flex h-11 flex-1 items-center gap-1.5"
          >
            {steps.map((name, index) => (
              <span key={name} className="h-1.5 flex-1 overflow-hidden rounded-pill bg-muted">
                <span
                  className={cn(
                    "block h-full origin-left rounded-pill bg-primary transition-transform duration-300 ease-out",
                    index <= stepIndex ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <m.div
              key={step}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: slide * dir }),
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: -slide * dir }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduceMotion ? 0.15 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === "name" ? <NameStep {...stepProps} showRule={!editing} /> : null}
              {step === "goal" ? <GoalStep {...stepProps} /> : null}
              {step === "level" ? <LevelStep {...stepProps} /> : null}
              {step === "target" ? <TargetStep {...stepProps} /> : null}
            </m.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-2">
          {saveFailed ? <Notice role="alert">{t.onboarding.saveError}</Notice> : null}
          <Button type="submit" className="w-full" loading={isSaving}>
            {!isLastStep ? t.common.next : editing ? t.common.save : t.onboarding.finish}
          </Button>
          {OPTIONAL_STEPS.includes(step) ? (
            <Button type="button" variant="ghost" size="md" className="w-full" disabled={isSaving} onClick={skip}>
              {t.common.skip}
            </Button>
          ) : null}
        </div>
      </form>
    </LazyMotion>
  );
}
