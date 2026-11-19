import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Mascot } from "@/components/brand/mascot";
import { ModeBadge } from "@/components/sessions/session-parts";
import { SessionTime } from "@/components/sessions/session-time";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n";
import { requestNow } from "@/lib/format/request-time";
import { requireProfile } from "@/services/profile";
import { getInvite } from "@/services/sessions";

import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: t.join.pageTitle };

function Message({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-8 md:justify-start">
      <header className="flex flex-col items-center gap-3 pt-6 text-center md:pt-0">
        <Mascot size={96} />
        <h1 className="text-title text-balance">{title}</h1>
        <p className="max-w-sm text-body text-pretty text-muted-foreground">{description}</p>
      </header>
      <Button asChild size="lg" variant="secondary" className="w-full">
        <Link href="/home">{t.common.backHome}</Link>
      </Button>
    </div>
  );
}

async function Invite({ params }: { params: PageProps<"/join/[code]">["params"] }) {
  const { code } = await params;
  await requireProfile(`/join/${code}`);

  const invite = await getInvite(code);
  if (!invite) return <Message title={t.join.notFoundTitle} description={t.join.notFoundDescription} />;
  if (invite.isHost) redirect(`/sessions/${invite.sessionId}`);
  if (invite.status === "completed" || invite.status === "cancelled") {
    return <Message title={t.join.closedTitle} description={t.join.closedDescription} />;
  }
  if (invite.isGuest) redirect(`/room/${invite.sessionId}`);
  if (invite.isFull) return <Message title={t.join.fullTitle} description={t.join.fullDescription} />;

  const now = (await requestNow()).toISOString();

  return (
    <div className="flex flex-1 flex-col justify-between gap-8 md:justify-start">
      <header className="flex flex-col items-center gap-4 pt-6 text-center md:pt-0">
        <Mascot mood="waving" size={96} />
        <h1 className="text-title text-balance">{t.join.title(invite.hostName ?? t.join.someone)}</h1>
        <div className="flex flex-wrap items-center justify-center gap-2 text-small text-muted-foreground">
          <ModeBadge mode={invite.mode} />
          <SessionTime iso={invite.scheduledAt} now={now} />
        </div>
        <p className="max-w-sm text-body text-pretty text-muted-foreground">{t.join.description}</p>
      </header>
      <JoinForm code={code} />
    </div>
  );
}

function InviteSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center gap-4 pt-6 md:pt-0">
      <Skeleton className="size-24 rounded-full" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-auto h-14 w-full rounded-pill md:mt-6" />
    </div>
  );
}

export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  return (
    <Suspense fallback={<InviteSkeleton />}>
      <Invite params={params} />
    </Suspense>
  );
}
