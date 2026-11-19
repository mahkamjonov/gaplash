import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * A page's one primary action. On phones it floats just above the tab bar, in the
 * thumb zone, so the page needs to leave room for it with `thumbActionSpace`. On
 * larger screens and short landscape phones it sits where it is placed.
 */
export function ThumbAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.875rem)] z-45 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] md:static md:z-auto md:shrink-0 md:px-0 short:static short:z-auto short:shrink-0 short:px-0">
      <Button asChild className="mx-auto flex w-full max-w-md md:w-auto short:w-auto">
        <Link href={href}>{children}</Link>
      </Button>
    </div>
  );
}

export const thumbActionSpace = "pb-16 md:pb-0 short:pb-0";
