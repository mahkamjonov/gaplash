import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n";
import type { SessionSummary } from "@/services/sessions/types";

import { ModeIcon, partnerLabel } from "./session-parts";
import { SessionTime } from "./session-time";

function SessionRow({ session, now }: { session: SessionSummary; now: string }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex min-h-18 items-center gap-4 px-4 py-3 outline-offset-[-2px] transition-colors duration-200 ease-out hover:bg-muted md:px-6"
    >
      <ModeIcon mode={session.mode} />
      {/* The badge drops below the text when there is no room beside it, so the text is never squeezed. */}
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex min-w-0 grow basis-44 flex-col">
          <span className="text-body font-semibold">
            <SessionTime iso={session.scheduledAt} now={now} />
          </span>
          <span className="truncate text-small text-muted-foreground">
            {t.modes[session.mode]} · {partnerLabel(session)}
          </span>
        </span>
        {session.status === "live" ? <Badge tone="success">{t.sessions.live}</Badge> : null}
        {session.status === "cancelled" ? <Badge tone="warm">{t.sessions.cancelled}</Badge> : null}
        {session.status === "completed" && session.rating ? (
          <Badge tone="success">{t.sessions.rated(session.rating)}</Badge>
        ) : null}
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-subtle" />
    </Link>
  );
}

/** A grouped list in the iOS style: one card, with rows separated by hairlines. */
export function SessionList({ sessions, now }: { sessions: SessionSummary[]; now: string }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card shadow-soft">
      {sessions.map((session) => (
        <li key={session.id}>
          <SessionRow session={session} now={now} />
        </li>
      ))}
    </ul>
  );
}
