import { describe, expect, it } from "vitest";

import { FREE_TALK_TOPICS, findFreeTalkQuestion } from "@/content/free-talk";
import { PART1_TOPICS } from "@/content/ielts";

import { IELTS_SECONDS, currentQuestions, initialRoomState, reduceRoom } from "./reducer";
import type { FreeTalkState, IeltsState, RoomAction, RoomState } from "./types";
import { isValidRoomState } from "./validate";

const A = "user-a";
const B = "user-b";
const NOW = Date.parse("2026-11-17T10:00:00Z");

/** A seeded generator, so every run picks the same content. */
function seeded(seed = 7) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

const ctx = (seconds = 0) => ({ now: NOW + seconds * 1000, random: seeded() });
const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce((s, a) => reduceRoom(s, a, ctx()), state);
const secondsUntil = (iso: string | null) => (iso ? (Date.parse(iso) - NOW) / 1000 : null);

describe("IELTS flow", () => {
  const lobby = initialRoomState("ielts", ctx()) as IeltsState;
  const started = run(lobby, { type: "start_ielts", examinerId: A, candidateId: B }) as IeltsState;

  it("starts in the lobby with no roles", () => {
    expect(lobby.phase).toBe("lobby");
    expect(lobby.examinerId).toBeNull();
  });

  it("starting assigns roles, two Part 1 topics, a cue card and a 5 minute Part 1", () => {
    expect(started.phase).toBe("part1");
    expect(started.examinerId).toBe(A);
    expect(started.candidateId).toBe(B);
    expect(started.part1TopicIds).toHaveLength(2);
    expect(started.cueCardId).not.toBeNull();
    expect(secondsUntil(started.endsAt)).toBe(IELTS_SECONDS.part1);
  });

  it("refuses the same person in both roles", () => {
    expect(run(lobby, { type: "start_ielts", examinerId: A, candidateId: A })).toEqual(lobby);
  });

  it("walks through the questions and stops at the last one", () => {
    const total = currentQuestions(started).length;
    let state: RoomState = started;
    for (let i = 0; i < total + 3; i++) state = run(state, { type: "next_question" });
    expect((state as IeltsState).questionIndex).toBe(total - 1);
  });

  it("runs Part 2 with a 1 minute preparation and a 2 minute talk, then Part 3", () => {
    const prep = run(started, { type: "next_phase" }) as IeltsState;
    expect(prep.phase).toBe("part2_prep");
    expect(secondsUntil(prep.endsAt)).toBe(IELTS_SECONDS.part2Prep);
    expect(currentQuestions(prep)).toEqual([]);

    const talk = run(prep, { type: "next_phase" }) as IeltsState;
    expect(talk.phase).toBe("part2_talk");
    expect(secondsUntil(talk.endsAt)).toBe(IELTS_SECONDS.part2Talk);

    const part3 = run(talk, { type: "next_phase" }) as IeltsState;
    expect(part3.phase).toBe("part3");
    expect(part3.questionIndex).toBe(0);
    expect(currentQuestions(part3).length).toBeGreaterThanOrEqual(4);
  });

  it("swaps roles after round 1 with fresh content, and ends after round 2", () => {
    const toSwap = run(started, { type: "next_phase" }, { type: "next_phase" }, { type: "next_phase" }, { type: "next_phase" });
    expect((toSwap as IeltsState).phase).toBe("swap");

    const round2 = run(toSwap, { type: "start_round_two" }) as IeltsState;
    expect(round2.round).toBe(2);
    expect(round2.examinerId).toBe(B);
    expect(round2.candidateId).toBe(A);
    expect(round2.phase).toBe("part1");
    expect(round2.part1TopicIds.some((id) => started.part1TopicIds.includes(id))).toBe(false);
    expect(round2.cueCardId).not.toBe(started.cueCardId);

    const end = run(round2, { type: "next_phase" }, { type: "next_phase" }, { type: "next_phase" }, { type: "next_phase" });
    expect((end as IeltsState).phase).toBe("done");
  });

  it("ignores actions that do not fit the current phase", () => {
    expect(run(lobby, { type: "next_phase" })).toEqual(lobby);
    expect(run(started, { type: "start_round_two" })).toEqual(started);
    expect(run(started, { type: "random_question" })).toEqual(started);
  });

  it("finish ends the session from any phase", () => {
    expect((run(started, { type: "finish" }) as IeltsState).phase).toBe("done");
  });
});

describe("Free talk", () => {
  const initial = initialRoomState("free_talk", ctx(), "a2_b1") as FreeTalkState;
  const levelOf = (state: FreeTalkState) => findFreeTalkQuestion(state.questionId)?.level;

  it("starts on a question at the chosen level", () => {
    expect(initial.phase).toBe("talk");
    expect(levelOf(initial)).toBe("a2_b1");
    expect(initial.seenQuestionIds).toEqual([initial.questionId]);
  });

  it("a random question is always a new one at the same level", () => {
    const next = run(initial, { type: "random_question" }) as FreeTalkState;
    expect(next.questionId).not.toBe(initial.questionId);
    expect(levelOf(next)).toBe("a2_b1");
  });

  it("changing the level changes the question to that level", () => {
    const harder = run(initial, { type: "set_level", level: "c1" }) as FreeTalkState;
    expect(harder.level).toBe("c1");
    expect(levelOf(harder)).toBe("c1");
  });

  it("the next topic is a different topic", () => {
    const next = run(initial, { type: "next_topic" }) as FreeTalkState;
    expect(next.topicId).not.toBe(initial.topicId);
  });

  it("keeps going after every question at a level has been seen", () => {
    const perLevel = FREE_TALK_TOPICS.flatMap((t) => t.questions).filter((q) => q.level === "b2").length;
    let state: RoomState = run(initial, { type: "set_level", level: "b2" });
    const seen = new Set<string>();
    for (let i = 0; i < perLevel * 2 + 5; i++) {
      state = run(state, { type: "random_question" });
      seen.add((state as FreeTalkState).questionId);
      expect(levelOf(state as FreeTalkState)).toBe("b2");
    }
    expect(seen.size).toBe(perLevel);
  });

  it("ignores everything once finished", () => {
    const done = run(initial, { type: "finish" });
    expect(run(done, { type: "random_question" })).toEqual(done);
  });
});

describe("isValidRoomState", () => {
  const ielts = run(initialRoomState("ielts", ctx()), { type: "start_ielts", examinerId: A, candidateId: B });
  const free = initialRoomState("free_talk", ctx());

  it("accepts real states", () => {
    expect(isValidRoomState(ielts, [A, B])).toBe(true);
    expect(isValidRoomState(free, [A, B])).toBe(true);
    expect(isValidRoomState(initialRoomState("ielts", ctx()), [A])).toBe(true);
  });

  it.each([
    ["an unknown kind", { ...free, kind: "chat" }],
    ["an outsider as examiner", { ...ielts, examinerId: "stranger" }],
    ["an unknown topic", { ...ielts, part1TopicIds: ["nope"] }],
    ["an unknown cue card", { ...ielts, cueCardId: "nope" }],
    ["a negative question index", { ...ielts, questionIndex: -1 }],
    ["an unknown level", { ...free, level: "c2" }],
    ["an unknown question", { ...free, questionId: "nope" }],
    ["a bad time", { ...ielts, endsAt: "soon" }],
    ["not an object", "hello"],
  ])("rejects %s", (_label, value) => {
    expect(isValidRoomState(value, [A, B])).toBe(false);
  });

  it("has enough Part 1 topics for two rounds without repeats", () => {
    expect(PART1_TOPICS.length).toBeGreaterThanOrEqual(4);
  });
});
