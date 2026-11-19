import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t.errors.notFoundTitle };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <EmptyState
        headingLevel="h1"
        title={t.errors.notFoundTitle}
        description={t.errors.notFoundDescription}
        action={
          <Button asChild size="md">
            <Link href="/home">{t.common.backHome}</Link>
          </Button>
        }
      />
    </main>
  );
}
