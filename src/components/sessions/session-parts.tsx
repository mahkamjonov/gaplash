import { GraduationCap, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import type { SessionMode, SessionSummary } from "@/services/sessions/types";

const MODE_ICONS = { ielts: GraduationCap, free_talk: MessageCircle };

export function ModeBadge({ mode }: { mode: SessionMode }) {
  const Icon = MODE_ICONS[mode];
  return (
    <Badge tone="primary">
      <Icon aria-hidden />
      {t.modes[mode]}
    </Badge>
  );
}

export function ModeIcon({ mode, className }: { mode: SessionMode; className?: string }) {
  const Icon = MODE_ICONS[mode];
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary-ink",
        className,
      )}
    >
      <Icon aria-hidden className="size-5" />
    </span>
  );
}

export function partnerLabel(session: SessionSummary) {
  return session.partnerName ? t.sessions.withPartner(session.partnerName) : t.sessions.noPartner;
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-body font-semibold text-primary-ink uppercase",
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  );
}
