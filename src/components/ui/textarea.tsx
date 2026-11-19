import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-32 w-full min-w-0 rounded-input border border-input bg-surface px-4 py-3 text-body text-foreground transition-[border-color,background-color] duration-200 ease-out outline-offset-0 placeholder:text-muted-foreground hover:border-foreground/60 disabled:pointer-events-none disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
