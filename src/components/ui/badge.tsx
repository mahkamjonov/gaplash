import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-7 w-fit items-center gap-1.5 rounded-pill px-3 text-caption font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-foreground",
        primary: "bg-primary-tint text-primary-ink",
        success: "bg-success-soft text-success-ink",
        warm: "bg-warm-soft text-warm-ink",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge };
