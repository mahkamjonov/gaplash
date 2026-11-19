"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { reduceRoom } from "@/lib/room/reducer";
import type { RoomAction, RoomState } from "@/lib/room/types";
import type { SessionStatus } from "@/services/sessions/types";

import type { ServerClock } from "./server-clock";

export type Person = { id: string; name: string };

export type SyncedRoom = {
  state: RoomState | null;
  version: number;
  status: SessionStatus;
  partner: Person | null;
};

export type SyncProblem = "offline" | "unstable" | null;

type ServerReply = {
  state: unknown;
  version: number;
  status: SessionStatus;
  serverNow: string;
  partner?: Person | null;
  applied?: boolean;
};

/** The server checked the state when it was saved; this only rejects the empty starting value. */
function asRoomState(value: unknown): RoomState | null {
  if (typeof value !== "object" || value === null) return null;
  const kind = (value as { kind?: unknown }).kind;
  return kind === "ielts" || kind === "free_talk" ? (value as RoomState) : null;
}

/**
 * What a person saw when they pressed a button. If the room has moved on by the time
 * the action runs (a double tap, or the partner was faster), the action is dropped,
 * so a tap can never skip a part.
 */
function fingerprint(state: RoomState | null) {
  if (!state) return "none";
  return state.kind === "ielts"
    ? `${state.phase}:${state.round}:${state.questionIndex}`
    : `${state.phase}:${state.level}:${state.topicId}:${state.questionId}`;
}

const statusFor = (action: RoomAction): "live" | "completed" | null =>
  action.type === "start_ielts" ? "live" : action.type === "finish" ? "completed" : null;

type Options = {
  sessionId: string;
  initial: SyncedRoom;
  clock: ServerClock;
  /** How often to ask the server. Slower when the video data channel already carries updates. */
  pollMs: number;
  /** Called after this person's change is saved, to tell the partner at once. */
  onSaved?: (version: number) => void;
};

/**
 * Keeps the room's shared state in step between the two people. The database is the
 * source of truth: every change is saved with the version it was based on, and a
 * change based on an old version is refused and replaced by the current state.
 */
export function useRoomSync({ sessionId, initial, clock, pollMs, onSaved }: Options) {
  const url = `/api/sessions/${sessionId}/room`;
  const [room, setRoom] = useState<SyncedRoom>(initial);
  const [problem, setProblem] = useState<SyncProblem>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const roomRef = useRef(room);
  const inFlight = useRef(0);
  const failures = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const commit = useCallback((next: SyncedRoom) => {
    roomRef.current = next;
    setRoom(next);
  }, []);

  const fromServer = useCallback(
    (reply: ServerReply): SyncedRoom => ({
      state: asRoomState(reply.state),
      version: reply.version,
      status: reply.status,
      partner: reply.partner === undefined ? roomRef.current.partner : reply.partner,
    }),
    [],
  );

  const refresh = useCallback(async () => {
    const sentAt = Date.now();
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const reply = (await response.json()) as ServerReply;
      clock.sync(reply.serverNow, sentAt, Date.now());
      failures.current = 0;
      setProblem(null);
      // While a change is being saved, its reply is the newer truth.
      if (inFlight.current === 0 && reply.version >= roomRef.current.version) commit(fromServer(reply));
    } catch {
      failures.current += 1;
      if (failures.current >= 2) setProblem(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unstable");
    }
  }, [url, clock, commit, fromServer]);

  /** Saves a new state worked out from the latest one. Resolves to true if it was saved. */
  const save = useCallback(
    (compute: (base: SyncedRoom, now: number) => { state: RoomState; status: "live" | "completed" | null } | null) => {
      const run = queue.current.then(async () => {
        const base = roomRef.current;
        const change = compute(base, clock.now());
        if (!change) return false;

        inFlight.current += 1;
        commit({ ...base, state: change.state, status: change.status ?? base.status });
        const sentAt = Date.now();
        let reply: ServerReply | null = null;
        let closed = false;

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ expectedVersion: base.version, state: change.state, status: change.status }),
          });
          if (response.status === 409) closed = true;
          else if (response.ok) reply = (await response.json()) as ServerReply;
        } catch {
          reply = null;
        } finally {
          inFlight.current -= 1;
        }

        const undo = () => commit({ ...roomRef.current, state: base.state, status: base.status, version: base.version });

        if (closed) {
          // The session was closed meanwhile, for example by the partner ending it.
          undo();
          await refresh();
          return false;
        }
        if (!reply) {
          undo();
          setSaveFailed(true);
          return false;
        }

        clock.sync(reply.serverNow, sentAt, Date.now());
        commit(fromServer(reply));
        setSaveFailed(false);
        if (reply.applied) onSavedRef.current?.(reply.version);
        return Boolean(reply.applied);
      });
      queue.current = run.catch(() => false);
      return run;
    },
    [url, clock, commit, fromServer, refresh],
  );

  const dispatch = useCallback(
    (action: RoomAction) => {
      const seen = fingerprint(roomRef.current.state);
      return save((base, now) => {
        if (!base.state || fingerprint(base.state) !== seen) return null;
        const next = reduceRoom(base.state, action, { now, random: Math.random });
        return next === base.state ? null : { state: next, status: statusFor(action) };
      });
    },
    [save],
  );

  /** Sets up the room the first time anyone opens it. If both do at once, one wins and the other adopts it. */
  const initialize = useCallback(
    (create: (now: number) => { state: RoomState; status: "live" | null }) =>
      save((base, now) => (base.state === null && base.version === 0 ? create(now) : null)),
    [save],
  );

  // Polls as a safety net, and catches up at once when the tab or the network comes back.
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(poll, pollMs);
    // A visit after the route was hidden starts from fresh data.
    const first = setTimeout(poll, 0);
    const onOffline = () => setProblem("offline");
    window.addEventListener("focus", poll);
    window.addEventListener("online", poll);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
      window.removeEventListener("focus", poll);
      window.removeEventListener("online", poll);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [pollMs, refresh]);

  /** The partner says they saved a newer version. */
  const hearOfVersion = useCallback(
    (version: number) => {
      if (version > roomRef.current.version) void refresh();
    },
    [refresh],
  );

  const clearSaveFailed = useCallback(() => setSaveFailed(false), []);

  return { room, problem, saveFailed, clearSaveFailed, dispatch, initialize, refresh, hearOfVersion };
}
