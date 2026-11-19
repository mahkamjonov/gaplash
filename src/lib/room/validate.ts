import { FREE_TALK_LEVELS, findFreeTalkQuestion, findFreeTalkTopic } from "@/content/free-talk";
import { findCueCard, findPart1Topic } from "@/content/ielts";

import type { RoomState } from "./types";

const IELTS_PHASES = ["lobby", "part1", "part2_prep", "part2_talk", "part3", "swap", "done"];

const isString = (value: unknown): value is string => typeof value === "string";
const isStringArray = (value: unknown, max: number): value is string[] =>
  Array.isArray(value) && value.length <= max && value.every(isString);
const isTimeOrNull = (value: unknown) => value === null || (isString(value) && !Number.isNaN(Date.parse(value)));

/**
 * Checks a room state from the network before it is saved or shown. Both participants can write
 * the state, so it is treated like any other input: the shape must match and every id must exist.
 */
export function isValidRoomState(value: unknown, participantIds: string[]): value is RoomState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;

  if (state.kind === "ielts") {
    const roleOk = (id: unknown) => id === null || (isString(id) && participantIds.includes(id));
    return (
      IELTS_PHASES.includes(state.phase as string) &&
      (state.round === 1 || state.round === 2) &&
      roleOk(state.examinerId) &&
      roleOk(state.candidateId) &&
      isStringArray(state.part1TopicIds, 4) &&
      state.part1TopicIds.every((id) => findPart1Topic(id) !== null) &&
      (state.cueCardId === null || (isString(state.cueCardId) && findCueCard(state.cueCardId) !== null)) &&
      Number.isInteger(state.questionIndex) &&
      (state.questionIndex as number) >= 0 &&
      (state.questionIndex as number) < 50 &&
      isTimeOrNull(state.endsAt) &&
      isStringArray(state.usedTopicIds, 20) &&
      isStringArray(state.usedCardIds, 20)
    );
  }

  if (state.kind === "free_talk") {
    return (
      (state.phase === "talk" || state.phase === "done") &&
      FREE_TALK_LEVELS.includes(state.level as never) &&
      isString(state.topicId) &&
      findFreeTalkTopic(state.topicId) !== null &&
      isString(state.questionId) &&
      findFreeTalkQuestion(state.questionId) !== null &&
      isStringArray(state.seenQuestionIds, 60) &&
      isString(state.startedAt) &&
      !Number.isNaN(Date.parse(state.startedAt))
    );
  }

  return false;
}
