"use client";

import { useState } from "react";
import { LogOut, Mic, MicOff, Video, VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

type RoomControlsProps = {
  micOn: boolean;
  cameraOn: boolean;
  /** False when there is no video connection, so the buttons would do nothing. */
  mediaReady: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  onEnd: () => void;
  ending: boolean;
  className?: string;
};

export function RoomControls({
  micOn,
  cameraOn,
  mediaReady,
  onToggleMic,
  onToggleCamera,
  onLeave,
  onEnd,
  ending,
  className,
}: RoomControlsProps) {
  const [leaveOpen, setLeaveOpen] = useState(false);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Keyboard shortcuts only help where there is a keyboard, so the hint shows on desktop. */}
      <p className="hidden text-center text-caption text-muted-foreground lg:block">{t.room.shortcuts}</p>
      <div className="flex items-center gap-3">
        <Button
          variant={micOn ? "outline" : "secondary"}
          size="icon"
          disabled={!mediaReady}
          aria-label={micOn ? t.room.micOff : t.room.micOn}
          aria-keyshortcuts="M"
          onClick={onToggleMic}
          className={cn(!micOn && "bg-warm-soft text-warm-ink hover:bg-warm-soft active:bg-warm-soft")}
        >
          {micOn ? <Mic /> : <MicOff />}
        </Button>
        <Button
          variant={cameraOn ? "outline" : "secondary"}
          size="icon"
          disabled={!mediaReady}
          aria-label={cameraOn ? t.room.cameraOff : t.room.cameraOn}
          aria-keyshortcuts="C"
          onClick={onToggleCamera}
          className={cn(!cameraOn && "bg-warm-soft text-warm-ink hover:bg-warm-soft active:bg-warm-soft")}
        >
          {cameraOn ? <Video /> : <VideoOff />}
        </Button>

        <ResponsiveSheet
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          title={t.room.leaveTitle}
          description={t.room.leaveDescription}
          trigger={
            <Button variant="outline" size="md" className="ml-auto">
              <LogOut aria-hidden />
              {t.room.leave}
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <Button loading={ending} onClick={onEnd}>
              {t.room.endForBoth}
            </Button>
            <Button variant="outline" onClick={onLeave}>
              {t.room.leaveOnly}
            </Button>
          </div>
        </ResponsiveSheet>
      </div>
    </div>
  );
}
