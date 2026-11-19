import { t } from "@/i18n";
import { cn } from "@/lib/utils";

import { formatClock } from "./server-clock";

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** In the last seconds the ring turns warm peach. Never red: running out of time is normal. */
const WARM_SECONDS = 10;

type TimerRingProps = {
  endsAt: string | null;
  totalSeconds: number;
  /** Server time; null while it is not known yet. */
  now: number | null;
  size?: "lg" | "sm";
  className?: string;
};

export function TimerRing({ endsAt, totalSeconds, now, size = "lg", className }: TimerRingProps) {
  const remaining = endsAt && now !== null ? Math.max(0, Date.parse(endsAt) - now) : totalSeconds * 1000;
  const fraction = Math.min(1, remaining / (totalSeconds * 1000));
  const isWarm = Math.ceil(remaining / 1000) <= WARM_SECONDS;
  const label = formatClock(remaining);

  return (
    <div
      role="timer"
      aria-label={`${t.room.timeLeft}: ${label}`}
      className={cn(
        "relative shrink-0",
        size === "lg" ? "size-[min(15rem,56vw)] short:size-36" : "size-16",
        className,
      )}
    >
      <svg viewBox="0 0 100 100" aria-hidden className="size-full -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth={size === "lg" ? 5 : 8} className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth={size === "lg" ? 5 : 8}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={cn(
            "transition-[stroke-dashoffset,stroke] duration-300 ease-linear motion-reduce:transition-none",
            isWarm ? "stroke-warm" : "stroke-primary",
          )}
        />
      </svg>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center font-semibold tabular-nums",
          size === "lg" ? "text-title short:text-heading" : "text-small",
          isWarm && "text-warm-ink",
        )}
      >
        {label}
      </span>
    </div>
  );
}
