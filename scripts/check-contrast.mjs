// Checks the design tokens in globals.css against WCAG AA, in light and dark mode.
// Exits non-zero if any pair fails, so it can run in CI.
import { readFileSync } from "node:fs";

const TEXT = 4.5;
const UI = 3;

const pairs = [
  ["foreground", "background", TEXT],
  ["foreground", "surface", TEXT],
  ["foreground", "muted", TEXT],
  ["muted-foreground", "background", TEXT],
  ["muted-foreground", "surface", TEXT],
  ["muted-foreground", "muted", TEXT],
  ["primary-foreground", "primary", TEXT],
  ["primary-foreground", "primary-hover", TEXT],
  ["primary-foreground", "primary-deep", TEXT],
  ["primary-ink", "background", TEXT],
  ["primary-ink", "surface", TEXT],
  ["primary-ink", "primary-tint", TEXT],
  ["primary-ink", "primary-tint-hover", TEXT],
  ["foreground", "primary-tint", TEXT],
  ["warm-ink", "warm-soft", TEXT],
  ["warm-ink", "background", TEXT],
  ["warm-ink", "surface", TEXT],
  ["success-ink", "success-soft", TEXT],
  ["destructive-foreground", "destructive", TEXT],
  ["destructive-foreground", "destructive-hover", TEXT],
  ["destructive-ink", "background", TEXT],
  ["destructive-ink", "surface", TEXT],
  ["destructive-ink", "destructive-soft", TEXT],
  ["foreground", "warm", TEXT, { light: true }],
  ["foreground", "success", TEXT, { light: true }],
  ["subtle", "background", UI],
  ["subtle", "surface", UI],
  ["input", "surface", UI],
  ["ring", "background", UI],
  ["ring", "surface", UI],
  ["stage-foreground", "stage", TEXT],
  ["stage-foreground", "stage-raised", TEXT],
  ["stage-muted", "stage", TEXT],
  ["stage-muted", "stage-raised", TEXT],
];

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function readTokens(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]),
  );
}

const lightBlock = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));
const darkBlock = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"), css.indexOf("@theme inline"));
const light = readTokens(lightBlock);
const dark = { ...light, ...readTokens(darkBlock) };

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let failures = 0;

for (const [mode, tokens] of [["light", light], ["dark", dark]]) {
  console.log(`\n${mode}`);
  for (const [fg, bg, min, opts] of pairs) {
    if (opts?.light && mode === "dark") continue;
    const value = ratio(tokens[fg], tokens[bg]);
    const pass = value >= min;
    if (!pass) failures += 1;
    const label = `${fg} on ${bg}`.padEnd(44);
    console.log(`  ${pass ? "pass" : "FAIL"}  ${label} ${value.toFixed(2).padStart(5)}  (min ${min})`);
  }
}

console.log(failures ? `\n${failures} pair(s) below AA.` : "\nAll pairs meet AA.");
process.exit(failures ? 1 : 0);
