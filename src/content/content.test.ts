import { describe, expect, it } from "vitest";

import { FREE_TALK_LEVELS, FREE_TALK_TOPICS } from "./free-talk";
import { CUE_CARDS, PART1_TOPICS } from "./ielts";

const unique = (values: string[]) => new Set(values).size === values.length;
const isSentence = (text: string) => text.trim().length > 8 && /[?.]$/.test(text);

describe("IELTS content", () => {
  it("has unique ids", () => {
    expect(unique(PART1_TOPICS.map((t) => t.id))).toBe(true);
    expect(unique(CUE_CARDS.map((c) => c.id))).toBe(true);
  });

  it("gives every Part 1 topic at least 4 questions", () => {
    for (const topic of PART1_TOPICS) {
      expect(topic.questions.length, topic.id).toBeGreaterThanOrEqual(4);
      expect(topic.questions.every(isSentence), topic.id).toBe(true);
    }
  });

  it("gives every cue card 3 points, a closing line and at least 4 Part 3 questions", () => {
    for (const card of CUE_CARDS) {
      expect(card.points, card.id).toHaveLength(3);
      expect(card.closing.startsWith("and explain"), card.id).toBe(true);
      expect(card.followUps.length, card.id).toBeGreaterThanOrEqual(4);
      expect(card.followUps.every(isSentence), card.id).toBe(true);
    }
  });
});

describe("Free-talk content", () => {
  it("has unique topic and question ids", () => {
    expect(unique(FREE_TALK_TOPICS.map((t) => t.id))).toBe(true);
    expect(unique(FREE_TALK_TOPICS.flatMap((t) => t.questions.map((q) => q.id)))).toBe(true);
  });

  it("gives every topic at least 2 questions at every level", () => {
    for (const topic of FREE_TALK_TOPICS) {
      for (const level of FREE_TALK_LEVELS) {
        const questions = topic.questions.filter((q) => q.level === level);
        expect(questions.length, `${topic.id} ${level}`).toBeGreaterThanOrEqual(2);
        expect(questions.every((q) => isSentence(q.text)), `${topic.id} ${level}`).toBe(true);
      }
    }
  });
});
