import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full min-w-0 rounded-input border border-input bg-surface px-4 text-body text-foreground transition-[border-color,background-color] duration-200 ease-out outline-offset-0 placeholder:text-muted-foreground hover:border-foreground/60 disabled:pointer-events-none disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
