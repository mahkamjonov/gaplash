import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Video } from "lucide-react";

import { InviteLink } from "@/components/sessions/invite-link";
import { ModeBadge } from "@/components/sessions/session-parts";
import { SessionTime } from "@/components/sessions/session-time";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n";
import { requestNow } from "@/lib/format/request-time";
import { requireProfile } from "@/services/profile";
import { getSession } from "@/services/sessions";

import { CancelSession } from "./cancel-session";

export const metadata: Metadata = { title: t.sessions.detailTitle };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-small text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-body font-semibold wrap-anywhere">{children}</dd>
    </div>
  );
}

async function SessionDetail({ params }: { params: PageProps<"/sessions/[id]">["params"] }) {
  const { id } = await params;
  await requireProfile(`/sessions/${id}`);

  const session = await getSession(id);
  if (!session) notFound();

  const now = (await requestNow()).toISOString();
  const isUpcoming = session.status === "scheduled" || session.status === "live";
  const needsPartner = isUpcoming && session.isHost && !session.partnerName && session.inviteCode;

  return (
    <div className="grid max-w-5xl grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <dl className="flex flex-col divide-y divide-border">
          <Row label={t.sessions.timeLabel}>
            <SessionTime iso={session.scheduledAt} now={now} />
          </Row>
          <Row label={t.sessions.modeLabel}>
            <ModeBadge mode={session.mode} />
          </Row>
          <Row label={t.sessions.partnerLabel}>{session.partnerName ?? t.sessions.noPartner}</Row>
          {session.durationMinutes ? (
            <Row label={t.sessions.durationLabel}>{t.sessions.minutes(session.durationMinutes)}</Row>
          ) : null}
          {session.rating ? (
            <Row label={t.sessions.ratingLabel}>
              <span className="tabular-nums">{session.rating}/5</span>
            </Row>
          ) : null}
          {session.status === "live" ? (
            <Row label={t.sessions.statusLabel}>
              <Badge tone="success">{t.sessions.live}</Badge>
            </Row>
          ) : null}
          {session.status === "cancelled" ? (
            <Row label={t.sessions.statusLabel}>
              <Badge tone="warm">{t.sessions.cancelled}</Badge>
            </Row>
          ) : null}
        </dl>

        {isUpcoming ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/room/${session.id}`}>
                <Video aria-hidden />
                {t.sessions.enterRoom}
              </Link>
            </Button>
            {session.isHost && session.status === "scheduled" ? <CancelSession sessionId={session.id} /> : null}
          </div>
        ) : null}
      </Card>

      {needsPartner ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.sessions.inviteTitle}</CardTitle>
            <CardDescription>{t.sessions.inviteDescription}</CardDescription>
          </CardHeader>
          <InviteLink code={session.inviteCode!} />
        </Card>
      ) : null}
    </div>
  );
}

export default function SessionPage({ params }: PageProps<"/sessions/[id]">) {
  return (
    <>
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="icon-sm" className="-ml-2">
          <Link href="/schedule" aria-label={t.common.back}>
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader title={t.sessions.detailTitle} />
      </div>
      <Suspense fallback={<Skeleton className="h-64 max-w-xl rounded-card" />}>
        <SessionDetail params={params} />
      </Suspense>
    </>
  );
}
