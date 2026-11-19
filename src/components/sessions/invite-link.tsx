"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Send, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/app";
import { t } from "@/i18n";

const subscribeToNothing = () => () => {};

/** The full invite URL on this site. The server only knows the path, so it renders that first. */
function useInviteUrl(code: string) {
  return useSyncExternalStore(
    subscribeToNothing,
    () => `${window.location.origin}/join/${code}`,
    () => `/join/${code}`,
  );
}

function useCanShare() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => false,
  );
}

export function InviteLink({ code }: { code: string }) {
  const url = useInviteUrl(code);
  const canShare = useCanShare();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be refused, for example on plain http. The link stays selectable.
      document.getElementById("invite-url")?.focus();
    }
  }

  async function share() {
    try {
      await navigator.share({ title: APP_NAME, text: t.sessions.shareText, url });
    } catch {
      // Closing the share sheet rejects too. Nothing to do.
    }
  }

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(t.sessions.shareText)}`;

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="invite-url" className="sr-only">
        {t.sessions.inviteLinkLabel}
      </label>
      <input
        id="invite-url"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="h-12 w-full min-w-0 truncate rounded-input border border-border bg-muted px-4 text-small text-foreground outline-offset-0"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button type="button" variant="secondary" size="md" onClick={copy} aria-live="polite">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? t.sessions.copied : t.sessions.copyLink}
        </Button>
        {canShare ? (
          <Button type="button" variant="outline" size="md" onClick={share}>
            <Share2 aria-hidden />
            {t.sessions.share}
          </Button>
        ) : null}
        <Button asChild variant="outline" size="md">
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
            <Send aria-hidden />
            {t.sessions.telegram}
          </a>
        </Button>
      </div>
    </div>
  );
}
