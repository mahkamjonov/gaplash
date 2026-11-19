"use client";

import { useIsSpeaking, useRemoteParticipants, useTracks, VideoTrack } from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import { Loader2, MicOff } from "lucide-react";

import { Avatar } from "@/components/sessions/session-parts";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

import type { Person } from "./use-room-sync";

function NameTag({ name, muted }: { name: string; muted?: boolean }) {
  return (
    <span className="flex max-w-full min-w-0 items-center gap-1.5 rounded-pill bg-stage/75 px-3 py-1 text-caption font-semibold text-stage-foreground backdrop-blur-sm">
      {muted ? <MicOff aria-label={t.room.partnerMuted} className="size-3.5 shrink-0" /> : null}
      <span className="truncate">{name}</span>
    </span>
  );
}

/** A soft mint outline while the partner talks: noticeable, never flashy. */
function SpeakingOutline({ participant }: { participant: Participant }) {
  const speaking = useIsSpeaking(participant);
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-card ring-3 ring-success ring-inset transition-opacity duration-200",
        speaking ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

type StageProps = {
  me: Person;
  partner: Person | null;
  /** A line shown when video is not available, in place of the partner's picture. */
  videoNotice: string | null;
  reconnecting: boolean;
  className?: string;
};

export function Stage({ me, partner, videoNotice, reconnecting, className }: StageProps) {
  const remotes = useRemoteParticipants();
  const remote = remotes.find((participant) => participant.identity === partner?.id) ?? remotes[0] ?? null;
  const cameras = useTracks([Track.Source.Camera]);
  const remoteCamera = cameras.find(
    (track) =>
      !track.participant.isLocal && track.participant.identity === remote?.identity && !track.publication.isMuted,
  );
  const localCamera = cameras.find((track) => track.participant.isLocal && !track.publication.isMuted);
  const partnerName = remote?.name || partner?.name || t.join.someone;

  const waitingText = videoNotice ?? (remote ? null : partner ? t.room.partnerJoining : t.room.partnerWaiting);

  return (
    <section
      aria-label={t.room.pageTitle}
      className={cn("relative isolate overflow-hidden rounded-card bg-stage text-stage-foreground", className)}
    >
      {remoteCamera ? (
        <VideoTrack trackRef={remoteCamera} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <Avatar
            name={partnerName}
            className="size-20 bg-stage-raised text-heading text-stage-foreground short:size-14"
          />
          {waitingText ? <p className="max-w-xs text-small text-stage-muted">{waitingText}</p> : null}
        </div>
      )}

      {remote ? (
        <>
          <SpeakingOutline participant={remote} />
          {/* Ends where the self view begins, so a long name truncates instead of collapsing. */}
          <span className="absolute right-28 bottom-3 left-3 flex md:right-36 lg:right-40 short:right-24">
            <NameTag name={partnerName} muted={!remote.isMicrophoneEnabled} />
          </span>
        </>
      ) : null}

      <div className="absolute right-3 bottom-3 aspect-[3/4] w-20 overflow-hidden rounded-xl bg-stage-raised shadow-lift ring-1 ring-white/10 md:w-28 lg:w-32 short:w-16">
        {localCamera ? (
          <VideoTrack trackRef={localCamera} className="size-full -scale-x-100 object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Avatar name={me.name || "?"} className="size-10 bg-stage text-stage-foreground" />
          </div>
        )}
        <span className="sr-only">{t.room.you}</span>
      </div>

      {reconnecting ? (
        <div className="absolute inset-x-0 top-3 flex justify-center px-3">
          <p
            role="status"
            className="flex items-center gap-2 rounded-pill bg-surface px-4 py-2 text-small font-semibold text-foreground shadow-lift"
          >
            <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            {t.room.reconnecting}
          </p>
        </div>
      ) : null}
    </section>
  );
}
