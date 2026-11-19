"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

let hasMounted = false;

/**
 * Page transition, for client-side navigation only. It is skipped on first load
 * because content that starts at opacity 0 delays LCP for no visible benefit.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const [animate, setAnimate] = useState(hasMounted);

  useEffect(() => {
    hasMounted = true;
    // Next keeps visited routes alive in a hidden <Activity>, which runs this
    // cleanup, so the first route also fades in when the user comes back to it.
    return () => setAnimate(true);
  }, []);

  return <div className={cn("flex flex-col gap-8", animate && "animate-page-enter")}>{children}</div>;
}
