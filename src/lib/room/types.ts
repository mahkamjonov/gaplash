import type { FreeTalkLevel } from "@/content/free-talk";

export type IeltsPhase = "lobby" | "part1" | "part2_prep" | "part2_talk" | "part3" | "swap" | "done";

export type IeltsState = {
  kind: "ielts";
  phase: IeltsPhase;
  /** Each person is the candidate once: round 1, then roles swap for round 2. */
  round: 1 | 2;
  examinerId: string | null;
  candidateId: string | null;
  part1TopicIds: string[];
  cueCardId: string | null;
  questionIndex: number;
  /** When the current part's timer runs out, as an ISO time on the server's clock. */
  endsAt: string | null;
  usedTopicIds: string[];
  usedCardIds: string[];
};

export type FreeTalkState = {
  kind: "free_talk";
  phase: "talk" | "done";
  level: FreeTalkLevel;
  topicId: string;
  questionId: string;
  seenQuestionIds: string[];
  startedAt: string;
};

export type RoomState = IeltsState | FreeTalkState;

export type RoomAction =
  | { type: "start_ielts"; examinerId: string; candidateId: string }
  | { type: "next_question" }
  | { type: "next_phase" }
  | { type: "start_round_two" }
  | { type: "set_level"; level: FreeTalkLevel }
  | { type: "next_topic" }
  | { type: "random_question" }
  | { type: "finish" };

/** Time and randomness are passed in, so the reducer stays pure and testable. */
export type RoomContext = {
  /** The current time on the server's clock, in milliseconds. */
  now: number;
  random: () => number;
};
