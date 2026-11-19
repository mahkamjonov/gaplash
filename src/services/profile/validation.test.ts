import { describe, expect, it } from "vitest";

import { parseProfile } from "./validation";

const valid = { displayName: "Malika", goal: "ielts", level: "B1", targetBand: 7, examDate: "2027-01-15" };

describe("parseProfile", () => {
  it("accepts complete answers", () => {
    expect(parseProfile(valid)).toEqual({ ok: true, value: valid });
  });

  it("accepts a name and goal alone, because the rest is optional", () => {
    expect(parseProfile({ displayName: "Malika", goal: "ielts" })).toEqual({
      ok: true,
      value: { displayName: "Malika", goal: "ielts", level: null, targetBand: null, examDate: null },
    });
  });

  it("tidies whitespace in the name", () => {
    const result = parseProfile({ ...valid, displayName: "  Malika   Karimova " });
    expect(result.ok && result.value.displayName).toBe("Malika Karimova");
  });

  it("treats an empty exam date as not given", () => {
    const result = parseProfile({ ...valid, examDate: "" });
    expect(result.ok && result.value.examDate).toBeNull();
  });

  it("drops the band and exam date when the goal is free talk", () => {
    const result = parseProfile({ ...valid, goal: "free_talk" });
    expect(result.ok && result.value.targetBand).toBeNull();
    expect(result.ok && result.value.examDate).toBeNull();
  });

  it.each([
    ["an empty name", { displayName: "   " }, "name"],
    ["a name that is too long", { displayName: "a".repeat(41) }, "name"],
    ["a name that is not text", { displayName: 42 }, "name"],
    ["no goal", { goal: undefined }, "goal"],
    ["an unknown goal", { goal: "dating" }, "goal"],
    ["an unknown level", { level: "C2" }, "level"],
    ["a band that is not a half step", { targetBand: 7.3 }, "band"],
    ["a band that is too high", { targetBand: 9.5 }, "band"],
    ["a band that is text", { targetBand: "7" }, "band"],
    ["a date in the wrong format", { examDate: "15.01.2027" }, "date"],
    ["a date that does not exist", { examDate: "2027-02-31" }, "date"],
  ])("rejects %s", (_label, changes, error) => {
    expect(parseProfile({ ...valid, ...changes })).toEqual({ ok: false, error });
  });
});
