import { describe, expect, it } from "vitest";

import { isValidEmail, safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it.each(["/home", "/sessions/abc", "/join/abc?ref=1", "/schedule#past"])("keeps the same-site path %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    ["a full URL", "https://evil.com"],
    ["a protocol-relative URL", "//evil.com"],
    ["a backslash URL", "/\\evil.com"],
    ["a double backslash URL", "\\\\evil.com"],
    ["a tab inside the slashes", "/\t/evil.com"],
    ["a newline inside the slashes", "/\n/evil.com"],
    ["a javascript URL", "javascript:alert(1)"],
    ["a relative path", "home"],
    ["an empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["an array", ["/home"]],
  ])("rejects %s", (_label, value) => {
    expect(safeNextPath(value)).toBe("/home");
  });
});

describe("isValidEmail", () => {
  it.each(["a@b.uz", "malika.karimova+test@gmail.com"])("accepts %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(["", "malika", "malika@", "@gmail.com", "malika@gmail", "a b@gmail.com", `${"a".repeat(250)}@b.uz`])(
    "rejects %j",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );
});
