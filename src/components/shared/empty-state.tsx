import type { ReactNode } from "react";

import { Mascot, type MascotMood } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  mood?: MascotMood;
  /** The one clear next step. */
  action?: ReactNode;
  headingLevel?: "h1" | "h2";
  className?: string;
};

export function EmptyState({
  title,
  description,
  mood = "default",
  action,
  headingLevel: Heading = "h2",
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-6 px-2 py-12 text-center md:py-16", className)}>
      <Mascot mood={mood} size={120} />
      <div className="flex max-w-md flex-col gap-2">
        <Heading className="text-heading text-balance">{title}</Heading>
        {description ? <p className="text-body text-pretty text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
