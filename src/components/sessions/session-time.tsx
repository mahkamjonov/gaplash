"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_TIME_ZONE, formatSessionTime } from "@/lib/format/date";

const subscribeToNothing = () => () => {};

type SessionTimeProps = {
  iso: string;
  /** The server's clock, so the first render here matches the HTML it sent. */
  now: string;
};

/** Shows a session time in the viewer's own time zone. The server only knows the default one. */
export function SessionTime({ iso, now }: SessionTimeProps) {
  const label = useSyncExternalStore(
    subscribeToNothing,
    () => formatSessionTime(iso, new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
    () => formatSessionTime(iso, new Date(now), DEFAULT_TIME_ZONE),
  );

  return <time dateTime={iso}>{label}</time>;
}
