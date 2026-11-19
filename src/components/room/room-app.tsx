"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RoomAudioRenderer,
  RoomContext,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
} from "@livekit/components-react";
import { ConnectionState, DisconnectReason, Room, RoomEvent } from "livekit-client";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { FreeTalkLevel } from "@/content/free-talk";
import { t } from "@/i18n";
import { currentQuestions, initialRoomState } from "@/lib/room/reducer";
import type { RoomAction } from "@/lib/room/types";
import type { RoomSnapshot } from "@/services/room";

import { Prejoin, type MediaPrefs } from "./prejoin";
import { RoomControls } from "./room-controls";
import { FreeTalkPanel, IeltsPanel } from "./room-panels";
import { RoomSkeleton } from "./room-skeleton";
import { ServerClock, useServerNow } from "./server-clock";
import { Stage } from "./stage";
import { useRoomSync } from "./use-room-sync";

const DATA_TOPIC = "room";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type RoomAppProps = {
  snapshot: RoomSnapshot;
  /** The video server address, or null when video is not set up. */
  videoUrl: string | null;
  defaultLevel: FreeTalkLevel;
};

export function RoomApp(props: RoomAppProps) {
  const [room] = useState(() => new Room({ adaptiveStream: true, dynacast: true }));
  return (
    <RoomContext.Provider value={room}>
      <LiveRoom {...props} room={room} />
    </RoomContext.Provider>
  );
}

/** Space is a shortcut only where it would not also press a focused button or tick a choice. */
function isInteractive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, a, input, textarea, select, [contenteditable], [role=dialog]"));
}

function isTyping(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable]"));
}

function LiveRoom({ snapshot, videoUrl, defaultLevel, room }: RoomAppProps & { room: Room }) {
  const router = useRouter();
  const { sessionId, mode, me } = snapshot;
  const [clock] = useState(() => new ServerClock(snapshot.serverNow));
  const now = useServerNow(clock);

  const [stage, setStage] = useState<"prejoin" | "live">("prejoin");
  const [prefs, setPrefs] = useState<MediaPrefs>({ micId: null, cameraId: null, micOn: true, cameraOn: false });
  const prefsRef = useRef(prefs);
  const [videoFailed, setVideoFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const connection = useConnectionState(room);
  const remotes = useRemoteParticipants();
  const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const isConnected = connection === ConnectionState.Connected;
  const reconnecting =
    connection === ConnectionState.Reconnecting || connection === ConnectionState.SignalReconnecting;

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Next keeps a left route mounted but hidden. Coming back starts in the waiting room again.
  useLayoutEffect(() => () => setStage("prejoin"), []);

  const broadcast = useCallback(
    (version: number) => {
      if (room.state !== ConnectionState.Connected) return;
      room.localParticipant
        .publishData(encoder.encode(JSON.stringify({ version })), { reliable: true, topic: DATA_TOPIC })
        .catch(() => {});
    },
    [room],
  );

  const partnerIdGuess = snapshot.partner?.id;
  const sync = useRoomSync({
    sessionId,
    initial: { state: snapshot.state, version: snapshot.version, status: snapshot.status, partner: snapshot.partner },
    clock,
    pollMs: isConnected && remotes.length > 0 ? 10_000 : stage === "live" ? 2_500 : 4_000,
    onSaved: broadcast,
  });
  const { room: shared, dispatch, initialize, refresh, hearOfVersion } = sync;
  const partner = shared.partner;
  const partnerOnline = remotes.some((participant) => participant.identity === (partner?.id ?? partnerIdGuess));

  // Video connection. Released in cleanup, which also runs when Next hides the route.
  useEffect(() => {
    if (!videoUrl) return;
    let cancelled = false;

    const onDisconnected = (reason?: DisconnectReason) => {
      if (!cancelled && reason !== DisconnectReason.CLIENT_INITIATED) setVideoFailed(true);
    };
    room.on(RoomEvent.Disconnected, onDisconnected);

    (async () => {
      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const { token } = (await response.json()) as { token: string };
        if (cancelled) return;
        await room.connect(videoUrl, token);
        if (!cancelled) setVideoFailed(false);
      } catch {
        if (!cancelled) setVideoFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.Disconnected, onDisconnected);
      void room.disconnect();
    };
  }, [room, videoUrl, sessionId, attempt]);

  // Try the video again by itself when the network returns.
  useEffect(() => {
    if (!videoFailed) return;
    const retry = () => setAttempt((count) => count + 1);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [videoFailed]);

  // The partner says they changed something; their participant joining may also mean news.
  useEffect(() => {
    const onData = (payload: Uint8Array, _participant?: unknown, _kind?: unknown, topic?: string) => {
      if (topic !== DATA_TOPIC) return;
      try {
        const { version } = JSON.parse(decoder.decode(payload)) as { version?: unknown };
        if (typeof version === "number") hearOfVersion(version);
      } catch {
        // Not a message for us.
      }
    };
    const onJoined = () => void refresh();
    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.ParticipantConnected, onJoined);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
      room.off(RoomEvent.ParticipantConnected, onJoined);
    };
  }, [room, hearOfVersion, refresh]);

  // Turn the microphone and camera on once per visit, as chosen in the waiting room.
  const published = useRef(false);
  useEffect(() => {
    if (stage !== "live") published.current = false;
  }, [stage]);
  useEffect(() => {
    const reset = () => {
      published.current = false;
    };
    room.on(RoomEvent.Disconnected, reset);
    return () => {
      room.off(RoomEvent.Disconnected, reset);
    };
  }, [room]);
  useEffect(() => {
    if (stage !== "live" || !isConnected || published.current) return;
    published.current = true;
    const { micOn, micId, cameraOn, cameraId } = prefsRef.current;
    const participant = room.localParticipant;
    participant.setMicrophoneEnabled(micOn, micId ? { deviceId: micId } : undefined).catch(() => {});
    participant.setCameraEnabled(cameraOn, cameraId ? { deviceId: cameraId } : undefined).catch(() => {});
  }, [stage, isConnected, room]);

  // The first person in sets the room up.
  useEffect(() => {
    if (stage !== "live" || shared.state !== null || shared.version !== 0) return;
    void initialize((serverNow) => ({
      state: initialRoomState(mode, { now: serverNow, random: Math.random }, defaultLevel),
      status: mode === "free_talk" ? "live" : null,
    }));
  }, [stage, shared.state, shared.version, initialize, mode, defaultLevel]);

  const micOn = isConnected ? isMicrophoneEnabled : prefs.micOn;
  const cameraOn = isConnected ? isCameraEnabled : prefs.cameraOn;

  const toggleMic = useCallback(() => {
    if (!isConnected) return;
    const next = !room.localParticipant.isMicrophoneEnabled;
    setPrefs((current) => ({ ...current, micOn: next }));
    room.localParticipant.setMicrophoneEnabled(next).catch(() => {});
  }, [isConnected, room]);

  const toggleCamera = useCallback(() => {
    if (!isConnected) return;
    const next = !room.localParticipant.isCameraEnabled;
    setPrefs((current) => ({ ...current, cameraOn: next }));
    room.localParticipant.setCameraEnabled(next).catch(() => {});
  }, [isConnected, room]);

  const leave = useCallback(() => router.push(`/sessions/${sessionId}`), [router, sessionId]);

  const finish = useCallback(async () => {
    setFinishing(true);
    const saved = shared.status === "completed" || (await dispatch({ type: "finish" }));
    if (saved) router.replace(`/sessions/${sessionId}`);
    else setFinishing(false);
  }, [dispatch, router, sessionId, shared.status]);

  // What Space does right now: the next question for the examiner, a new question in free talk.
  const nextAction = useMemo((): RoomAction | null => {
    const state = shared.state;
    if (!state) return null;
    if (state.kind === "free_talk") return state.phase === "talk" ? { type: "random_question" } : null;
    if (state.examinerId !== me.id || (state.phase !== "part1" && state.phase !== "part3")) return null;
    return state.questionIndex < currentQuestions(state).length - 1 ? { type: "next_question" } : null;
  }, [shared.state, me.id]);

  useEffect(() => {
    if (stage !== "live") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === " " && !isInteractive(event.target)) {
        event.preventDefault();
        if (nextAction) void dispatch(nextAction);
      } else if ((event.key === "m" || event.key === "M") && !isTyping(event.target)) {
        toggleMic();
      } else if ((event.key === "c" || event.key === "C") && !isTyping(event.target)) {
        toggleCamera();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, nextAction, dispatch, toggleMic, toggleCamera]);

  const videoNotice = !videoUrl ? t.room.videoUnavailable : videoFailed ? t.room.videoFailed : null;
  const showReconnecting = reconnecting || (stage === "live" && sync.problem !== null);

  if (stage === "prejoin") {
    return (
      <Prejoin
        sessionId={sessionId}
        me={me}
        partner={partner}
        partnerOnline={partnerOnline}
        knowsPresence={isConnected}
        inviteCode={snapshot.inviteCode}
        videoNotice={videoNotice}
        onJoin={(chosen) => {
          setPrefs(chosen);
          prefsRef.current = chosen;
          // Pressing join counts as the gesture browsers need before playing the partner's audio.
          room.startAudio().catch(() => {});
          setStage("live");
        }}
      />
    );
  }

  const state = shared.state;

  // Side by side on wide screens and phones held sideways; stacked on upright phones and tablets.
  return (
    <div className="flex h-full flex-col lg:flex-row md:landscape:flex-row short:flex-row">
      <div className="flex h-[38dvh] shrink-0 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:p-4 lg:h-auto lg:flex-1 md:landscape:h-auto md:landscape:flex-1 short:h-auto short:flex-1 short:p-2">
        <Stage
          me={me}
          partner={partner}
          videoNotice={videoNotice}
          reconnecting={showReconnecting}
          className="flex-1"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:landscape:w-[24rem] md:landscape:flex-none lg:w-[30rem] lg:flex-none short:w-[min(24rem,50vw)] short:flex-none">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 md:px-6 md:py-6 short:px-4 short:py-3">
          {videoFailed ? (
            <div className="flex flex-col gap-2">
              <Notice>{t.room.videoFailed}</Notice>
              <Button variant="ghost" size="sm" className="self-start" onClick={() => setAttempt((count) => count + 1)}>
                {t.common.retry}
              </Button>
            </div>
          ) : null}
          {sync.saveFailed ? <Notice role="alert">{t.room.actionFailed}</Notice> : null}

          {!state ? (
            <RoomSkeleton panelOnly />
          ) : state.kind === "ielts" ? (
            <IeltsPanel
              state={state}
              me={me}
              partner={partner}
              now={now}
              clock={clock}
              dispatch={dispatch}
              onFinish={finish}
              finishing={finishing}
            />
          ) : (
            <FreeTalkPanel state={state} now={now} dispatch={dispatch} onFinish={finish} finishing={finishing} />
          )}
        </div>

        <RoomControls
          micOn={micOn}
          cameraOn={cameraOn}
          mediaReady={isConnected}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onLeave={leave}
          onEnd={finish}
          ending={finishing}
          className="border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6"
        />
      </div>

      <RoomAudioRenderer />
    </div>
  );
}
