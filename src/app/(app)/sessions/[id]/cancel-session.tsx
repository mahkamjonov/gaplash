"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { t } from "@/i18n";

import { cancelSessionAction } from "../actions";

/** Cancelling cannot be undone and the partner sees it, so it asks first. */
export function CancelSession({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setFailed(false);
    startTransition(async () => {
      const ok = await cancelSessionAction(sessionId).catch(() => false);
      if (!ok) {
        setFailed(true);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={setOpen}
      title={t.sessions.cancelTitle}
      description={t.sessions.cancelDescription}
      trigger={
        <Button variant="ghost" size="md" className="w-full sm:w-auto">
          {t.sessions.cancel}
        </Button>
      }
    >
      {failed ? <Notice role="alert">{t.sessions.cancelError}</Notice> : null}
      <Button variant="destructive" className="w-full" loading={isPending} onClick={confirm}>
        {t.sessions.cancelConfirm}
      </Button>
    </ResponsiveSheet>
  );
}
