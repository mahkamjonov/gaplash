"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, Video, VideoOff } from "lucide-react";

import { InviteLink } from "@/components/sessions/invite-link";
import { Avatar } from "@/components/sessions/session-parts";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

import type { Person } from "./use-room-sync";

export type MediaPrefs = {
  micId: string | null;
  cameraId: string | null;
  micOn: boolean;
  cameraOn: boolean;
};

type MicProblem = "denied" | "missing" | null;

const selectStyles =
  "h-12 w-full min-w-0 appearance-none truncate rounded-input border border-input bg-surface bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat pr-11 pl-4 text-body text-foreground";
// A chevron drawn in the muted text color, since a native select's own arrow is removed above.
const chevron = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a7a85' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
};

function stop(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function micProblemFor(error: unknown): MicProblem {
  const name = error instanceof DOMException ? error.name : "";
  return name === "NotAllowedError" || name === "SecurityError" ? "denied" : "missing";
}

/** A live bar that moves with the voice, so people can see the microphone works. */
function MicLevel({ stream }: { stream: MediaStream | null }) {
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let frame = 0;

    const draw = () => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
      const level = Math.min(1, Math.sqrt(sum / samples.length) * 5);
      if (barRef.current) barRef.current.style.width = `${Math.round(level * 100)}%`;
      frame = requestAnimationFrame(draw);
    };
    draw();

    // Browsers start audio suspended until the person interacts with the page.
    const resume = () => void context.resume().catch(() => {});
    resume();
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      source.disconnect();
      void context.close().catch(() => {});
    };
  }, [stream]);

  return (
    <span aria-hidden className="block h-2 w-full overflow-hidden rounded-pill bg-muted">
      <span ref={barRef} className="block h-full w-0 rounded-pill bg-success-ink transition-[width] duration-75" />
    </span>
  );
}

function CameraPreview({ stream, name }: { stream: MediaStream | null; name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-card bg-stage text-stage-foreground short:aspect-video">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" />
      ) : (
        <Avatar name={name || "?"} className="size-24 bg-stage-raised text-heading text-stage-foreground" />
      )}
    </div>
  );
}

function PartnerStatus({
  partner,
  online,
  knowsPresence,
}: {
  partner: Person | null;
  online: boolean;
  knowsPresence: boolean;
}) {
  const text = !partner
    ? t.room.partnerWaiting
    : online
      ? t.room.partnerOnline(partner.name)
      : t.room.partnerAccepted(partner.name);

  return (
    <div role="status" className="flex items-center gap-3 rounded-input bg-muted px-4 py-3">
      <span
        aria-hidden
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          online ? "bg-success-ink" : partner ? "bg-primary" : "bg-subtle",
        )}
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-small font-semibold">{text}</span>
        {partner && !online && knowsPresence ? (
          <span className="text-caption text-muted-foreground">{t.room.partnerJoining}</span>
        ) : null}
      </span>
    </div>
  );
}

type PrejoinProps = {
  sessionId: string;
  me: Person;
  partner: Person | null;
  partnerOnline: boolean;
  /** Whether the video service is connected, so presence can be shown. */
  knowsPresence: boolean;
  inviteCode: string | null;
  videoNotice: string | null;
  onJoin: (prefs: MediaPrefs) => void;
};

/** The waiting room: check the microphone and camera, see whether the partner is here, then go in. */
export function Prejoin({
  sessionId,
  me,
  partner,
  partnerOnline,
  knowsPresence,
  inviteCode,
  videoNotice,
  onJoin,
}: PrejoinProps) {
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micProblem, setMicProblem] = useState<MicProblem>(null);
  const [cameraProblem, setCameraProblem] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);

  const streams = useRef<{
    mic: MediaStream | null;
    camera: MediaStream | null;
  }>({ mic: null, camera: null });

  const listDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMics(devices.filter((device) => device.kind === "audioinput" && device.deviceId));
      setCameras(devices.filter((device) => device.kind === "videoinput" && device.deviceId));
    } catch {
      // Device names are a nicety; the default devices still work.
    }
  }, []);

  // Microphone: opened on arrival and again when another one is picked.
  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => setMicProblem("missing"));
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: micId ? { deviceId: { exact: micId } } : true })
      .then((stream) => {
        if (cancelled) return stop(stream);
        stop(streams.current.mic);
        streams.current.mic = stream;
        setMicStream(stream);
        setMicProblem(null);
        void listDevices();
      })
      .catch((error: unknown) => {
        if (!cancelled) setMicProblem(micProblemFor(error));
      });
    return () => {
      cancelled = true;
    };
  }, [micId, listDevices]);

  // Camera: optional, and only open while it is switched on.
  useEffect(() => {
    let cancelled = false;
    if (!cameraOn || !navigator.mediaDevices?.getUserMedia) {
      stop(streams.current.camera);
      streams.current.camera = null;
      queueMicrotask(() => {
        if (!cancelled) setCameraStream(null);
      });
      return () => {
        cancelled = true;
      };
    }
    navigator.mediaDevices
      .getUserMedia({
        video: cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "user" },
      })
      .then((stream) => {
        if (cancelled) return stop(stream);
        stop(streams.current.camera);
        streams.current.camera = stream;
        setCameraStream(stream);
        setCameraProblem(false);
        void listDevices();
      })
      .catch(() => {
        if (cancelled) return;
        setCameraProblem(true);
        setCameraOn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cameraOn, cameraId, listDevices]);

  // Everything is released when the waiting room closes, including when Next hides the route.
  useEffect(() => {
    const current = streams.current;
    const onDeviceChange = () => void listDevices();
    navigator.mediaDevices?.addEventListener("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", onDeviceChange);
      stop(current.mic);
      stop(current.camera);
      current.mic = null;
      current.camera = null;
    };
  }, [listDevices]);

  function join() {
    const prefs: MediaPrefs = {
      micId: micStream?.getAudioTracks()[0]?.getSettings().deviceId ?? micId,
      cameraId: cameraStream?.getVideoTracks()[0]?.getSettings().deviceId ?? cameraId,
      micOn: micProblem === null,
      // The switch decides, not whether the preview had loaded: joining quickly must not turn the camera off.
      cameraOn: cameraOn && !cameraProblem,
    };
    stop(streams.current.mic);
    stop(streams.current.camera);
    streams.current.mic = null;
    streams.current.camera = null;
    onJoin(prefs);
  }

  const showInvite = !partner && inviteCode;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:justify-center md:px-8 md:py-10">
        <div>
          <Button asChild variant="ghost" size="icon-sm" className="-ml-2">
            <Link href={`/sessions/${sessionId}`} aria-label={t.common.back}>
              <ArrowLeft />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10 short:grid-cols-2">
          <CameraPreview stream={cameraOn ? cameraStream : null} name={me.name} />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="text-title">{t.room.prejoinTitle}</h1>
              <p className="text-body text-muted-foreground">{t.room.prejoinDescription}</p>
            </div>

            <PartnerStatus partner={partner} online={partnerOnline} knowsPresence={knowsPresence} />

            <div className="flex flex-col gap-2">
              <label htmlFor="mic-select" className="flex items-center gap-2 text-small font-semibold">
                <Mic aria-hidden className="size-4" />
                {t.room.micLabel}
              </label>
              {mics.length > 1 ? (
                <select
                  id="mic-select"
                  className={selectStyles}
                  style={chevron}
                  value={micId ?? micStream?.getAudioTracks()[0]?.getSettings().deviceId ?? ""}
                  onChange={(event) => setMicId(event.target.value)}
                >
                  {mics.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `${t.room.micLabel} ${index + 1}`}
                    </option>
                  ))}
                </select>
              ) : null}
              {micProblem ? (
                <Notice role="alert">{micProblem === "denied" ? t.room.permissionDenied : t.room.noMicrophone}</Notice>
              ) : (
                <>
                  <MicLevel stream={micStream} />
                  <p className="text-caption text-muted-foreground">{t.room.levelHint}</p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 flex-col">
                  <span id="camera-label" className="flex items-center gap-2 text-small font-semibold">
                    <Video aria-hidden className="size-4" />
                    {t.room.cameraLabel}
                  </span>
                  <span className="text-caption text-muted-foreground">{t.room.cameraHint}</span>
                </span>
                <Button
                  type="button"
                  role="switch"
                  aria-checked={cameraOn}
                  aria-labelledby="camera-label"
                  variant={cameraOn ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => {
                    setCameraProblem(false);
                    setCameraOn((on) => !on);
                  }}
                >
                  {cameraOn ? <Video aria-hidden /> : <VideoOff aria-hidden />}
                </Button>
              </div>
              {cameraOn && cameras.length > 1 ? (
                <select
                  aria-labelledby="camera-label"
                  className={selectStyles}
                  style={chevron}
                  value={cameraId ?? cameraStream?.getVideoTracks()[0]?.getSettings().deviceId ?? ""}
                  onChange={(event) => setCameraId(event.target.value)}
                >
                  {cameras.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `${t.room.cameraLabel} ${index + 1}`}
                    </option>
                  ))}
                </select>
              ) : null}
              {cameraProblem ? <Notice>{t.room.cameraUnavailable}</Notice> : null}
            </div>

            {videoNotice ? <Notice>{videoNotice}</Notice> : null}

            <Button className="w-full" onClick={join}>
              {t.room.join}
            </Button>
          </div>
        </div>

        {showInvite ? (
          <Card className="md:mt-4">
            <CardHeader>
              <CardTitle>{t.sessions.inviteTitle}</CardTitle>
              <CardDescription>{t.sessions.inviteDescription}</CardDescription>
            </CardHeader>
            <InviteLink code={inviteCode} />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
