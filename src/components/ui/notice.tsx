import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/** A gentle, warm message for things the user should know, including errors. Never red. */
function Notice({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="notice"
      className={cn("flex items-start gap-3 rounded-input bg-warm-soft px-4 py-3 text-small text-warm-ink", className)}
      {...props}
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export { Notice };
