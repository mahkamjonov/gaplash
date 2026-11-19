import { Mascot } from "@/components/brand/mascot";
import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";

type WordmarkProps = {
  /** Hides the name below the desktop breakpoint, for the tablet icon rail. */
  collapseBelowDesktop?: boolean;
  className?: string;
};

export function Wordmark({ collapseBelowDesktop = false, className }: WordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Mascot size={40} />
      <span className={cn("text-subheading font-bold", collapseBelowDesktop && "sr-only lg:not-sr-only")}>{APP_NAME}</span>
    </span>
  );
}
