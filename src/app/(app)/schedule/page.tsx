import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { SessionList } from "@/components/sessions/session-list";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ThumbAction, thumbActionSpace } from "@/components/shared/thumb-action";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n";
import { requestNow } from "@/lib/format/request-time";
import { cn } from "@/lib/utils";
import { requireProfile } from "@/services/profile";
import { listSessions } from "@/services/sessions";
import type { SessionSummary } from "@/services/sessions/types";

export const metadata: Metadata = { title: t.nav.schedule };

function SessionSection({
  title,
  sessions,
  emptyText,
  now,
}: {
  title: string;
  sessions: SessionSummary[];
  emptyText: string;
  now: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-subheading">{title}</h2>
      {sessions.length > 0 ? (
        <SessionList sessions={sessions} now={now} />
      ) : (
        <p className="rounded-card border border-border px-6 py-8 text-center text-small text-muted-foreground">
          {emptyText}
        </p>
      )}
    </section>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
      {[0, 1].map((column) => (
        <div key={column} className="flex flex-col gap-4">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-52 rounded-card" />
        </div>
      ))}
    </div>
  );
}

async function ScheduleContent() {
  await requireProfile("/schedule");
  const { upcoming, past } = await listSessions();
  const now = (await requestNow()).toISOString();

  if (upcoming.length === 0 && past.length === 0) {
    return <EmptyState title={t.schedule.emptyTitle} description={t.schedule.emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
      <SessionSection title={t.schedule.upcoming} sessions={upcoming} emptyText={t.schedule.emptyUpcoming} now={now} />
      <SessionSection title={t.schedule.past} sessions={past} emptyText={t.schedule.emptyPast} now={now} />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <div className={cn("flex flex-col gap-8", thumbActionSpace)}>
      <div className="flex items-end justify-between gap-6">
        <PageHeader title={t.nav.schedule} />
        <ThumbAction href="/sessions/new">
          <Plus aria-hidden />
          {t.home.newSession}
        </ThumbAction>
      </div>
      <Suspense fallback={<ScheduleSkeleton />}>
        <ScheduleContent />
      </Suspense>
    </div>
  );
}
