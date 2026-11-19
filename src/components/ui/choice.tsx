import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type RadioProps = Omit<ComponentProps<"input">, "type" | "className">;

const choiceStyles =
  "cursor-pointer border border-border bg-surface transition-[background-color,border-color,scale] duration-200 ease-out hover:border-subtle active:scale-[0.99] motion-reduce:active:scale-100 has-checked:border-primary has-checked:bg-primary-tint has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring";

/** A large radio option. The selected state shows a check icon as well as color. */
function ChoiceCard({
  title,
  description,
  icon: Icon,
  ...props
}: RadioProps & { title: ReactNode; description?: ReactNode; icon?: LucideIcon }) {
  return (
    <label className={cn("group flex min-h-18 items-center gap-4 rounded-card px-4 py-3", choiceStyles)}>
      <input type="radio" className="sr-only" {...props} />
      {Icon ? (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary-ink group-has-checked:bg-surface">
          <Icon aria-hidden className="size-6" />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-semibold">{title}</span>
        {description ? <span className="text-small text-muted-foreground group-has-checked:text-foreground">{description}</span> : null}
      </span>
      <CircleCheck aria-hidden className="size-6 shrink-0 text-primary-ink opacity-0 group-has-checked:opacity-100" />
    </label>
  );
}

/** A compact radio option for short values such as a band score. */
function ChoiceChip({ children, ...props }: RadioProps & { children: ReactNode }) {
  return (
    <label className={cn("flex h-12 items-center justify-center rounded-pill text-body font-semibold has-checked:text-primary-ink", choiceStyles)}>
      <input type="radio" className="sr-only" {...props} />
      {children}
    </label>
  );
}

export { ChoiceCard, ChoiceChip };
