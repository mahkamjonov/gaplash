import { useId } from "react";

import { cn } from "@/lib/utils";

export type MascotMood = "default" | "waving" | "celebrating";

type MascotProps = {
  mood?: MascotMood;
  size?: number;
  /** Gives the mascot an accessible name. Leave out when it is decorative. */
  title?: string;
  className?: string;
};

const BODY =
  "M60 18C84 18 102 33 102 55C102 77 84 92 60 92C54 92 48.4 91.1 43.3 89.4C38 94 30.5 99 23.5 100.4C21.5 100.8 20.2 98.6 21.4 97C24.8 92.4 27 87.4 27.6 82.4C21.6 75.8 18 66.4 18 55C18 33 36 18 60 18Z";

export function Mascot({ mood = "default", size = 96, title, className }: MascotProps) {
  const gradientId = useId();
  const armColor = "var(--mascot-to)";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      className={cn("shrink-0", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <defs>
        <linearGradient id={gradientId} x1="36" y1="18" x2="84" y2="100" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: "var(--mascot-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--mascot-to)" }} />
        </linearGradient>
      </defs>

      {mood === "waving" ? (
        <path
          d="M98 58L111 41"
          stroke={armColor}
          strokeWidth="10"
          strokeLinecap="round"
          className="animate-mascot-wave"
          style={{ transformOrigin: "98px 58px" }}
        />
      ) : null}

      {mood === "celebrating" ? (
        <>
          <path d="M22 54L9 36" stroke={armColor} strokeWidth="10" strokeLinecap="round" />
          <path d="M98 54L111 36" stroke={armColor} strokeWidth="10" strokeLinecap="round" />
          <g className="animate-mascot-pop" style={{ transformOrigin: "60px 40px" }}>
            <circle cx="24" cy="14" r="3.5" style={{ fill: "var(--warm)" }} />
            <circle cx="98" cy="12" r="3" style={{ fill: "var(--success)" }} />
            <path
              d="M60 2L61.8 6.2L66 8L61.8 9.8L60 14L58.2 9.8L54 8L58.2 6.2Z"
              style={{ fill: "var(--primary)" }}
            />
            <circle cx="112" cy="58" r="2.5" style={{ fill: "var(--warm)" }} />
            <circle cx="8" cy="60" r="2.5" style={{ fill: "var(--success)" }} />
          </g>
        </>
      ) : null}

      <path d={BODY} fill={`url(#${gradientId})`} />

      <ellipse cx="36" cy="63" rx="6" ry="3.75" style={{ fill: "var(--warm)" }} opacity="0.5" />
      <ellipse cx="84" cy="63" rx="6" ry="3.75" style={{ fill: "var(--warm)" }} opacity="0.5" />

      <g className="animate-mascot-blink" style={{ transformOrigin: "60px 50px" }}>
        <circle cx="46" cy="50" r="5" style={{ fill: "var(--mascot-face)" }} />
        <circle cx="74" cy="50" r="5" style={{ fill: "var(--mascot-face)" }} />
      </g>

      {mood === "celebrating" ? (
        <path d="M51 61C54 71 66 71 69 61Z" strokeWidth="3" strokeLinejoin="round" style={{ fill: "var(--mascot-face)", stroke: "var(--mascot-face)" }} />
      ) : (
        <path d="M53 63C56 68 64 68 67 63" strokeWidth="3.5" strokeLinecap="round" style={{ stroke: "var(--mascot-face)" }} />
      )}
    </svg>
  );
}
