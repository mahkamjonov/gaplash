import { createCn } from "cn/config";

/** Merges class names and resolves Tailwind conflicts, including the custom design tokens. */
export const cn = createCn({
  extend: {
    theme: {
      text: ["display", "title", "heading", "subheading", "body-lg", "body", "small", "caption", "label"],
      radius: ["input", "card", "pill"],
      shadow: ["soft", "lift", "primary"],
    },
  },
});
