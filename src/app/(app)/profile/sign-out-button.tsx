"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { SubmitButton } from "@/components/shared/submit-button";
import { Notice } from "@/components/ui/notice";
import { t } from "@/i18n";

import { signOutAction } from "./actions";

export function SignOutButton() {
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setFailed(false);
    try {
      await signOutAction();
      // A full page load, because Next keeps visited routes alive in hidden DOM. Without it
      // the previous user's name and email would stay in memory on a shared device.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the full load is the point
      window.location.assign("/login");
    } catch {
      setFailed(true);
    }
  }

  return (
    <form action={signOut} className="flex flex-col gap-2">
      <SubmitButton variant="ghost" size="md" className="w-full md:w-auto">
        <LogOut aria-hidden />
        {t.profile.signOut}
      </SubmitButton>
      {failed ? <Notice role="alert">{t.auth.errors.network}</Notice> : null}
    </form>
  );
}
