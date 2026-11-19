import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n";
import { requireProfile } from "@/services/profile";

import { NewSessionForm } from "./new-session-form";

export const metadata: Metadata = { title: t.sessions.newTitle };

async function NewSession() {
  const { profile } = await requireProfile("/sessions/new");
  return <NewSessionForm defaultMode={profile.goal} />;
}

function FormSkeleton() {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-18 rounded-card" />
      <Skeleton className="h-18 rounded-card" />
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <>
      <PageHeader title={t.sessions.newTitle} description={t.sessions.newSubtitle} />
      <Suspense fallback={<FormSkeleton />}>
        <NewSession />
      </Suspense>
    </>
  );
}
