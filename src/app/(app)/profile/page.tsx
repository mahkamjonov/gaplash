import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { Avatar } from "@/components/sessions/session-parts";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IS_MOCK_MODE } from "@/config/app";
import { t } from "@/i18n";
import { formatCalendarDate } from "@/lib/format/date";
import { MOCK_SCENARIOS, readMockState } from "@/services/mock/store";
import { requireProfile } from "@/services/profile";

import { setMockScenarioAction } from "./actions";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: t.nav.profile };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-small text-muted-foreground">{label}</dt>
      <dd className="text-right text-body font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

async function MockPanel() {
  const state = await readMockState();

  return (
    <Card className="border-dashed shadow-none">
      <CardHeader>
        <CardTitle>{t.profile.mockTitle}</CardTitle>
        <CardDescription>{t.profile.mockDescription}</CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-2">
        {MOCK_SCENARIOS.filter((scenario) => scenario !== state?.scenario).map((scenario) => (
          <form key={scenario} action={setMockScenarioAction.bind(null, scenario)}>
            <SubmitButton variant="outline" size="sm" className="w-full">
              {t.profile.mockScenarios[scenario]}
            </SubmitButton>
          </form>
        ))}
      </div>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-56 rounded-card" />
    </div>
  );
}

async function ProfileContent() {
  const { user, profile } = await requireProfile("/profile");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <header className="flex items-center gap-4">
        <Avatar name={profile.displayName} className="size-16 text-heading" />
        <div className="flex min-w-0 flex-col">
          <h1 className="text-heading wrap-anywhere">{profile.displayName}</h1>
          {user.email ? <p className="text-small wrap-anywhere text-muted-foreground">{user.email}</p> : null}
        </div>
      </header>

      <Card>
        <dl className="flex flex-col divide-y divide-border">
          <Row label={t.profile.goal}>{t.modes[profile.goal]}</Row>
          <Row label={t.profile.level}>{profile.level ?? t.profile.notSet}</Row>
          {profile.goal === "ielts" ? (
            <>
              <Row label={t.profile.targetBand}>{profile.targetBand?.toFixed(1) ?? t.profile.notSet}</Row>
              <Row label={t.profile.examDate}>
                {profile.examDate ? formatCalendarDate(profile.examDate) : t.profile.notSet}
              </Row>
            </>
          ) : null}
        </dl>
      </Card>

      <div className="flex flex-col gap-2 md:flex-row">
        <Button asChild variant="secondary" size="md">
          <Link href="/onboarding?edit=1">
            <Pencil aria-hidden />
            {t.profile.edit}
          </Link>
        </Button>
        <SignOutButton />
      </div>

      {IS_MOCK_MODE ? <MockPanel /> : null}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
