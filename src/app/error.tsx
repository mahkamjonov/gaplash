"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <EmptyState
        headingLevel="h1"
        title={t.errors.genericTitle}
        description={t.errors.genericDescription}
        action={
          <Button size="md" onClick={() => retry()}>
            {t.common.retry}
          </Button>
        }
      />
    </main>
  );
}
