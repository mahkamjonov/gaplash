import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { Avatar, ModeBadge, partnerLabel } from "@/components/sessions/session-parts";
import { SessionTime } from "@/components/sessions/session-time";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ThumbAction, thumbActionSpace } from "@/components/shared/thumb-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n";
import { requestNow } from "@/lib/format/request-time";
import { cn } from "@/lib/utils";
import { requireProfile } from "@/services/profile";
import { listSessions } from "@/services/sessions";
import type { SessionSummary } from "@/services/sessions/types";

export const metadata: Metadata = { title: t.nav.home };

function NextSessionCard({ session, now }: { session: SessionSummary; now: string }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="group flex flex-col gap-6 rounded-card border border-border bg-linear-to-br from-primary-tint to-surface p-6 shadow-soft transition-[box-shadow,scale] duration-200 ease-out hover:shadow-lift active:scale-[0.99] motion-reduce:active:scale-100 md:p-8"
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-small font-semibold text-primary-ink">{t.home.nextTitle}</span>
        <ModeBadge mode={session.mode} />
      </span>
      <span className="text-heading">
        <SessionTime iso={session.scheduledAt} now={now} />
      </span>
      <span className="flex items-center gap-3">
        <Avatar name={session.partnerName ?? "?"} className="bg-surface" />
        <span className="min-w-0 flex-1 truncate text-body">{partnerLabel(session)}</span>
        <ChevronRight
          aria-hidden
          className="size-5 shrink-0 text-subtle transition-transform duration-200 ease-out group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function LastSessionCard({ session, now }: { session: SessionSummary; now: string }) {
  return (
    <Card className="transition-shadow duration-200 ease-out hover:shadow-lift" asChild>
      <Link href={`/sessions/${session.id}`}>
        <CardHeader>
          <CardDescription className="font-semibold">{t.home.lastTitle}</CardDescription>
          <CardTitle>
            <SessionTime iso={session.scheduledAt} now={now} />
          </CardTitle>
        </CardHeader>
        <span className="flex flex-wrap items-center gap-2">
          <ModeBadge mode={session.mode} />
          {session.rating ? <Badge tone="success">{t.sessions.rated(session.rating)}</Badge> : null}
        </span>
        <span className="text-small text-muted-foreground">
          {partnerLabel(session)}
          {session.durationMinutes ? ` · ${t.sessions.minutes(session.durationMinutes)}` : null}
        </span>
      </Link>
    </Card>
  );
}

function NoNextSessionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.home.noNextTitle}</CardTitle>
        <CardDescription>{t.home.noNextDescription}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <div className={cn("flex flex-col gap-8", thumbActionSpace)}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-2/3 max-w-xs" />
        <Skeleton className="h-7 w-1/2 max-w-2xs" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Skeleton className="h-52 rounded-card" />
        <Skeleton className="h-52 rounded-card" />
      </div>
    </div>
  );
}

async function HomeContent() {
  const { profile } = await requireProfile("/home");
  const { upcoming, past } = await listSessions();
  const now = (await requestNow()).toISOString();

  const nextSession = upcoming[0];
  const lastSession = past.find((session) => session.status === "completed");
  const hasHistory = Boolean(nextSession || lastSession);

  return (
    <div className={cn("flex flex-col gap-8", thumbActionSpace)}>
      <div className="flex items-end justify-between gap-6">
        <PageHeader title={t.home.greeting(profile.displayName)} description={t.home.subtitle} />
        <ThumbAction href="/sessions/new">
          <Plus aria-hidden />
          {t.home.newSession}
        </ThumbAction>
      </div>

      {hasHistory ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {nextSession ? <NextSessionCard session={nextSession} now={now} /> : <NoNextSessionCard />}
          {lastSession ? <LastSessionCard session={lastSession} now={now} /> : null}
        </div>
      ) : (
        <EmptyState mood="waving" title={t.home.emptyTitle} description={t.home.emptyDescription} />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
