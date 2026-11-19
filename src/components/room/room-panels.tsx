"use client";

import { useEffect, type ReactNode } from "react";
import { ArrowRight, Shuffle, Sparkles } from "lucide-react";

import { Mascot } from "@/components/brand/mascot";
import { Button } from "@/components/ui/button";
import { ChoiceChip } from "@/components/ui/choice";
import { FREE_TALK_LEVELS, findFreeTalkQuestion, findFreeTalkTopic } from "@/content/free-talk";
import { CUE_CARD_LEAD, findCueCard } from "@/content/ielts";
import { t } from "@/i18n";
import { currentQuestions, IELTS_SECONDS } from "@/lib/room/reducer";
import type { FreeTalkState, IeltsPhase, IeltsState, RoomAction } from "@/lib/room/types";

import { formatElapsed, type ServerClock } from "./server-clock";
import { TimerRing } from "./timer-ring";
import type { Person } from "./use-room-sync";

type Dispatch = (action: RoomAction) => Promise<boolean>;

/** If the examiner's device is away when preparation ends, the candidate's starts the talk instead. */
const CANDIDATE_GRACE_MS = 3000;

const PART_SECONDS: Partial<Record<IeltsPhase, number>> = {
  part1: IELTS_SECONDS.part1,
  part2_prep: IELTS_SECONDS.part2Prep,
  part2_talk: IELTS_SECONDS.part2Talk,
  part3: IELTS_SECONDS.part3,
};

const PART_NAMES: Partial<Record<IeltsPhase, string>> = {
  part1: t.room.part1,
  part2_prep: t.room.part2Prep,
  part2_talk: t.room.part2Talk,
  part3: t.room.part3,
};

function PanelHeader({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col">
        <h1 className="text-subheading">{title}</h1>
        {subtitle ? <p className="text-small text-muted-foreground">{subtitle}</p> : null}
      </div>
      {aside}
    </header>
  );
}

export function DoneView({ onFinish, busy }: { onFinish: () => void; busy: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Mascot mood="celebrating" size={112} className="short:size-20" />
      <h1 className="text-heading">{t.room.doneTitle}</h1>
      <p className="max-w-xs text-body text-muted-foreground">{t.room.doneDescription}</p>
      <Button className="mt-2 w-full max-w-xs" loading={busy} onClick={onFinish}>
        {t.room.finish}
      </Button>
    </div>
  );
}

/* IELTS */

type IeltsPanelProps = {
  state: IeltsState;
  me: Person;
  partner: Person | null;
  now: number | null;
  clock: ServerClock;
  dispatch: Dispatch;
  onFinish: () => void;
  finishing: boolean;
};

export function IeltsPanel({ state, me, partner, now, clock, dispatch, onFinish, finishing }: IeltsPanelProps) {
  const isExaminer = state.examinerId === me.id;

  // Part 2 preparation ends on its own, as in the test.
  useEffect(() => {
    if (state.phase !== "part2_prep" || !state.endsAt) return;
    const wait = Date.parse(state.endsAt) - clock.now() + (isExaminer ? 0 : CANDIDATE_GRACE_MS);
    const timer = setTimeout(() => void dispatch({ type: "next_phase" }), Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [state.phase, state.endsAt, isExaminer, clock, dispatch]);

  if (state.phase === "lobby") return <Lobby me={me} partner={partner} dispatch={dispatch} />;
  if (state.phase === "done") return <DoneView onFinish={onFinish} busy={finishing} />;

  if (state.phase === "swap") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Mascot size={96} className="short:size-16" />
        <h1 className="text-heading">{t.room.swapTitle}</h1>
        <p className="max-w-xs text-body text-muted-foreground">
          {isExaminer ? t.room.swapYouNext : t.room.swapPartnerNext(partner?.name ?? t.join.someone)}
        </p>
        <Button className="mt-2 w-full max-w-xs" onClick={() => void dispatch({ type: "start_round_two" })}>
          {t.room.continue}
          <ArrowRight aria-hidden />
        </Button>
      </div>
    );
  }

  const total = PART_SECONDS[state.phase] ?? IELTS_SECONDS.part1;
  const smallTimer = <TimerRing size="sm" endsAt={state.endsAt} totalSeconds={total} now={now} />;
  const header = (
    <PanelHeader
      title={PART_NAMES[state.phase] ?? ""}
      subtitle={isExaminer ? t.room.youAreExaminer : t.room.youAreCandidate}
      aside={isExaminer || state.phase === "part2_prep" ? smallTimer : null}
    />
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      {header}
      {isExaminer ? (
        <ExaminerView state={state} dispatch={dispatch} />
      ) : (
        <CandidateView state={state} now={now} total={total} />
      )}
    </div>
  );
}

function Lobby({ me, partner, dispatch }: { me: Person; partner: Person | null; dispatch: Dispatch }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-heading text-balance">{t.room.lobbyTitle}</h1>
        <p className="text-body text-muted-foreground">{t.room.lobbyDescription}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          disabled={!partner}
          onClick={() =>
            partner &&
            void dispatch({
              type: "start_ielts",
              examinerId: partner.id,
              candidateId: me.id,
            })
          }
        >
          {t.room.meFirst}
        </Button>
        <Button
          variant="secondary"
          disabled={!partner}
          onClick={() =>
            partner &&
            void dispatch({
              type: "start_ielts",
              examinerId: me.id,
              candidateId: partner.id,
            })
          }
        >
          {t.room.partnerFirst(partner?.name ?? t.join.someone)}
        </Button>
      </div>
      {!partner ? <p className="text-small text-muted-foreground">{t.room.waitingForPartner}</p> : null}
    </div>
  );
}

function CueCardView({ cardId }: { cardId: string | null }) {
  const card = findCueCard(cardId);
  if (!card) return null;
  return (
    <section
      aria-label={t.room.cueCard}
      lang="en"
      className="rounded-card border border-border bg-surface p-5 shadow-soft md:p-6"
    >
      <p className="text-body-lg font-semibold text-balance">{card.prompt}</p>
      <p className="mt-4 text-small text-muted-foreground">{CUE_CARD_LEAD}</p>
      <ul className="mt-1 list-disc pl-5 text-body marker:text-subtle">
        {card.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="mt-2 text-body">{card.closing}</p>
    </section>
  );
}

/** The examiner reads the questions aloud and moves the session along. */
function ExaminerView({ state, dispatch }: { state: IeltsState; dispatch: Dispatch }) {
  if (state.phase === "part2_prep" || state.phase === "part2_talk") {
    const card = findCueCard(state.cueCardId);
    const isPrep = state.phase === "part2_prep";
    return (
      <div className="flex flex-1 flex-col gap-6">
        {card ? (
          <div className="flex flex-col gap-2">
            <p className="text-small text-muted-foreground">{t.room.cueCard}</p>
            <p lang="en" className="text-heading text-balance">
              {card.prompt}
            </p>
          </div>
        ) : null}
        <p className="text-body text-muted-foreground">{isPrep ? t.room.examinerPrepHint : t.room.examinerTalkHint}</p>
        <div className="mt-auto flex flex-col gap-3">
          <Button variant={isPrep ? "secondary" : "primary"} onClick={() => void dispatch({ type: "next_phase" })}>
            {isPrep ? t.room.startTalk : t.room.toPart3}
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    );
  }

  const questions = currentQuestions(state);
  const index = Math.min(state.questionIndex, Math.max(0, questions.length - 1));
  const question = questions[index];
  const isLast = index >= questions.length - 1;
  const phaseLabel = state.phase === "part1" ? t.room.toPart2 : t.room.endRound;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div key={`${state.phase}-${index}`} className="flex animate-page-enter flex-col gap-3">
        <p className="text-small text-muted-foreground">
          {question?.topic ? <span lang="en">{question.topic} · </span> : null}
          {t.room.questionCount(index + 1, questions.length)}
        </p>
        <p lang="en" className="text-heading text-balance lg:text-title">
          {question?.text}
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        {isLast ? null : (
          <Button onClick={() => void dispatch({ type: "next_question" })}>
            {t.room.nextQuestion}
            <ArrowRight aria-hidden />
          </Button>
        )}
        <Button
          variant={isLast ? "primary" : "outline"}
          size={isLast ? "lg" : "md"}
          onClick={() => void dispatch({ type: "next_phase" })}
        >
          {phaseLabel}
        </Button>
      </div>
    </div>
  );
}

/** The candidate sees no question text: they listen, as in the real test. */
function CandidateView({ state, now, total }: { state: IeltsState; now: number | null; total: number }) {
  if (state.phase === "part2_prep") {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <CueCardView cardId={state.cueCardId} />
        <p className="text-small text-muted-foreground">{t.room.prepHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <TimerRing endsAt={state.endsAt} totalSeconds={total} now={now} />
      <p className="max-w-xs text-body text-muted-foreground">
        {state.phase === "part2_talk" ? t.room.talkHint : t.room.candidateHint}
      </p>
    </div>
  );
}

/* Free talk */

type FreeTalkPanelProps = {
  state: FreeTalkState;
  now: number | null;
  dispatch: Dispatch;
  onFinish: () => void;
  finishing: boolean;
};

export function FreeTalkPanel({ state, now, dispatch, onFinish, finishing }: FreeTalkPanelProps) {
  if (state.phase === "done") return <DoneView onFinish={onFinish} busy={finishing} />;

  const topic = findFreeTalkTopic(state.topicId);
  const question = findFreeTalkQuestion(state.questionId);
  const elapsed = now === null ? null : formatElapsed(now - Date.parse(state.startedAt));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h1 lang="en" className="text-subheading">
            {topic?.title}
          </h1>
          <p className="text-small text-muted-foreground">
            {t.room.topic} · <span className="sr-only">{t.room.elapsed} </span>
            <span className="tabular-nums">{elapsed ?? "0:00"}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="-mr-3 shrink-0"
          onClick={() => void dispatch({ type: "next_topic" })}
        >
          <Shuffle aria-hidden />
          {t.room.nextTopic}
        </Button>
      </header>

      <div key={state.questionId} className="animate-page-enter rounded-card bg-primary-tint p-6 md:p-8">
        <p lang="en" className="text-heading text-balance text-foreground lg:text-title">
          {question?.text}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-small font-semibold">{t.room.level}</legend>
        <div className="grid grid-cols-3 gap-2">
          {FREE_TALK_LEVELS.map((level) => (
            <ChoiceChip
              key={level}
              name="level"
              value={level}
              checked={state.level === level}
              onChange={() => void dispatch({ type: "set_level", level })}
            >
              {t.room.levels[level]}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      <Button className="mt-auto" onClick={() => void dispatch({ type: "random_question" })}>
        <Sparkles aria-hidden />
        {t.room.silence}
      </Button>
    </div>
  );
}
