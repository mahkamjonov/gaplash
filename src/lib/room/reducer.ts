import { FREE_TALK_LEVELS, FREE_TALK_TOPICS, findFreeTalkTopic, type FreeTalkLevel } from "@/content/free-talk";
import { CUE_CARDS, PART1_TOPICS, findCueCard, findPart1Topic } from "@/content/ielts";

import type { FreeTalkState, IeltsPhase, IeltsState, RoomAction, RoomContext, RoomState } from "./types";

/** Part lengths in seconds. Part 1 and Part 3 are soft limits; Part 2 is timed as in the test. */
export const IELTS_SECONDS = { part1: 300, part2Prep: 60, part2Talk: 120, part3: 300 } as const;

const PART1_TOPICS_PER_ROUND = 2;
const MAX_SEEN_QUESTIONS = 60;

function pick<T>(items: T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function pickMany<T>(items: T[], count: number, random: () => number): T[] {
  const pool = [...items];
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, count);
}

const timeAfter = (ctx: RoomContext, seconds: number) => new Date(ctx.now + seconds * 1000).toISOString();

export type PartQuestion = { topic: string | null; text: string };

/** The questions the examiner reads in the current part, in order. */
export function currentQuestions(state: IeltsState): PartQuestion[] {
  if (state.phase === "part1") {
    return state.part1TopicIds.flatMap((id) => {
      const topic = findPart1Topic(id);
      return topic ? topic.questions.map((text) => ({ topic: topic.title, text })) : [];
    });
  }
  if (state.phase === "part3") {
    return (findCueCard(state.cueCardId)?.followUps ?? []).map((text) => ({ topic: null, text }));
  }
  return [];
}

export function initialRoomState(
  mode: "ielts" | "free_talk",
  ctx: RoomContext,
  level: FreeTalkLevel = "b2",
): RoomState {
  if (mode === "ielts") {
    return {
      kind: "ielts",
      phase: "lobby",
      round: 1,
      examinerId: null,
      candidateId: null,
      part1TopicIds: [],
      cueCardId: null,
      questionIndex: 0,
      endsAt: null,
      usedTopicIds: [],
      usedCardIds: [],
    };
  }

  const topic = pick(FREE_TALK_TOPICS, ctx.random);
  return withQuestion(
    {
      kind: "free_talk",
      phase: "talk",
      level,
      topicId: topic.id,
      questionId: "",
      seenQuestionIds: [],
      startedAt: new Date(ctx.now).toISOString(),
    },
    topic.id,
    ctx,
  );
}

export function reduceRoom(state: RoomState, action: RoomAction, ctx: RoomContext): RoomState {
  if (action.type === "finish") {
    return state.kind === "ielts" ? { ...state, phase: "done", endsAt: null } : { ...state, phase: "done" };
  }
  return state.kind === "ielts" ? reduceIelts(state, action, ctx) : reduceFreeTalk(state, action, ctx);
}

function startRound(
  state: IeltsState,
  roles: { examinerId: string | null; candidateId: string | null },
  round: 1 | 2,
  ctx: RoomContext,
): IeltsState {
  const freshTopics = PART1_TOPICS.filter((topic) => !state.usedTopicIds.includes(topic.id));
  const topics = pickMany(
    freshTopics.length >= PART1_TOPICS_PER_ROUND ? freshTopics : PART1_TOPICS,
    PART1_TOPICS_PER_ROUND,
    ctx.random,
  );
  const freshCards = CUE_CARDS.filter((card) => !state.usedCardIds.includes(card.id));
  const card = pick(freshCards.length > 0 ? freshCards : CUE_CARDS, ctx.random);

  return {
    ...state,
    ...roles,
    round,
    phase: "part1",
    part1TopicIds: topics.map((topic) => topic.id),
    cueCardId: card.id,
    questionIndex: 0,
    endsAt: timeAfter(ctx, IELTS_SECONDS.part1),
    usedTopicIds: [...state.usedTopicIds, ...topics.map((topic) => topic.id)],
    usedCardIds: [...state.usedCardIds, card.id],
  };
}

const NEXT_PHASE: Partial<Record<IeltsPhase, { phase: IeltsPhase; seconds: number | null }>> = {
  part1: { phase: "part2_prep", seconds: IELTS_SECONDS.part2Prep },
  part2_prep: { phase: "part2_talk", seconds: IELTS_SECONDS.part2Talk },
  part2_talk: { phase: "part3", seconds: IELTS_SECONDS.part3 },
};

function reduceIelts(state: IeltsState, action: RoomAction, ctx: RoomContext): IeltsState {
  switch (action.type) {
    case "start_ielts":
      if (state.phase !== "lobby" || action.examinerId === action.candidateId) return state;
      return startRound(state, { examinerId: action.examinerId, candidateId: action.candidateId }, 1, ctx);

    case "next_question": {
      const last = currentQuestions(state).length - 1;
      return state.questionIndex < last ? { ...state, questionIndex: state.questionIndex + 1 } : state;
    }

    case "next_phase": {
      if (state.phase === "part3") {
        return { ...state, phase: state.round === 1 ? "swap" : "done", endsAt: null, questionIndex: 0 };
      }
      const next = NEXT_PHASE[state.phase];
      if (!next) return state;
      return {
        ...state,
        phase: next.phase,
        questionIndex: 0,
        endsAt: next.seconds === null ? null : timeAfter(ctx, next.seconds),
      };
    }

    case "start_round_two":
      if (state.phase !== "swap") return state;
      return startRound(state, { examinerId: state.candidateId, candidateId: state.examinerId }, 2, ctx);

    default:
      return state;
  }
}

function reduceFreeTalk(state: FreeTalkState, action: RoomAction, ctx: RoomContext): FreeTalkState {
  if (state.phase === "done") return state;

  switch (action.type) {
    case "set_level":
      if (action.level === state.level || !FREE_TALK_LEVELS.includes(action.level)) return state;
      return withQuestion({ ...state, level: action.level }, state.topicId, ctx);

    case "next_topic": {
      const others = FREE_TALK_TOPICS.filter((topic) => topic.id !== state.topicId);
      return withQuestion(state, pick(others, ctx.random).id, ctx);
    }

    case "random_question":
      return withQuestion(state, state.topicId, ctx);

    default:
      return state;
  }
}

/** Moves to a fresh question at the current level: from this topic if possible, then from any topic. */
function withQuestion(state: FreeTalkState, topicId: string, ctx: RoomContext): FreeTalkState {
  const fresh = (question: { id: string; level: FreeTalkLevel }) =>
    question.level === state.level && question.id !== state.questionId && !state.seenQuestionIds.includes(question.id);

  const inTopic = (findFreeTalkTopic(topicId)?.questions ?? []).filter(fresh);
  let chosen = inTopic.length > 0 ? { topicId, question: pick(inTopic, ctx.random) } : null;

  if (!chosen) {
    const everywhere = FREE_TALK_TOPICS.flatMap((topic) =>
      topic.questions.filter(fresh).map((question) => ({ topicId: topic.id, question })),
    );
    chosen = everywhere.length > 0 ? pick(everywhere, ctx.random) : null;
  }

  if (!chosen) {
    // Every question at this level has been seen: start over, avoiding only the current one.
    const reset = FREE_TALK_TOPICS.flatMap((topic) =>
      topic.questions
        .filter((question) => question.level === state.level && question.id !== state.questionId)
        .map((question) => ({ topicId: topic.id, question })),
    );
    chosen = pick(reset, ctx.random);
    return { ...state, topicId: chosen.topicId, questionId: chosen.question.id, seenQuestionIds: [chosen.question.id] };
  }

  return {
    ...state,
    topicId: chosen.topicId,
    questionId: chosen.question.id,
    seenQuestionIds: [...state.seenQuestionIds, chosen.question.id].slice(-MAX_SEEN_QUESTIONS),
  };
}
