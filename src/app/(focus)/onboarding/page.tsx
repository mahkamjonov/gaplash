import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n";
import { safeNextPath } from "@/lib/auth/next-path";
import { getCurrentUser } from "@/services/auth";
import { getProfile } from "@/services/profile";

import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = { title: t.onboarding.pageTitle };

function OnboardingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <Skeleton className="my-5 h-1.5 w-full rounded-pill" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="mt-3 h-14 w-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-pill" />
    </div>
  );
}

async function Onboarding({ searchParams }: { searchParams: PageProps<"/onboarding">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const editing = params.edit === "1";

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (profile && !editing) redirect(next);

  return (
    <OnboardingFlow
      next={next}
      editing={editing}
      initial={{
        displayName: profile?.displayName ?? user.suggestedName ?? "",
        goal: profile?.goal ?? null,
        level: profile?.level ?? null,
        targetBand: profile?.targetBand ?? null,
        examDate: profile?.examDate ?? "",
      }}
    />
  );
}

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <Onboarding searchParams={searchParams} />
    </Suspense>
  );
}
