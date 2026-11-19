"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 250;

/**
 * The server's clock, estimated from response times, so both people see the same
 * countdown even when one device's clock is off. Ticks only while something listens.
 */
export class ServerClock {
  private offset = 0;
  private bestRoundTrip = Number.POSITIVE_INFINITY;
  private current: number;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(serverNow: string) {
    this.offset = Date.parse(serverNow) - Date.now();
    this.current = this.quantized();
  }

  /** The current time on the server's clock, in milliseconds. */
  now() {
    return Date.now() + this.offset;
  }

  /** Learns from one request: the fastest round trip gives the most accurate offset. */
  sync(serverNow: string, sentAt: number, receivedAt: number) {
    const server = Date.parse(serverNow);
    const roundTrip = receivedAt - sentAt;
    if (Number.isNaN(server) || roundTrip < 0) return;
    // Older samples go stale as clocks drift, so a slightly slower fresh one may still replace them.
    if (roundTrip > this.bestRoundTrip * 1.5 + 50) return;
    this.bestRoundTrip = Math.min(this.bestRoundTrip, roundTrip);
    this.offset = server + roundTrip / 2 - receivedAt;
  }

  private quantized() {
    return Math.floor(this.now() / TICK_MS) * TICK_MS;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.timer) {
      this.timer = setInterval(() => {
        const next = this.quantized();
        if (next === this.current) return;
        this.current = next;
        this.listeners.forEach((notify) => notify());
      }, TICK_MS / 2);
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  };

  getSnapshot = () => this.current;
}

const noServerTime = () => null;

/** Server time, updated four times a second. Null during server rendering. */
export function useServerNow(clock: ServerClock): number | null {
  return useSyncExternalStore(clock.subscribe, clock.getSnapshot, noServerTime);
}

export function formatClock(milliseconds: number) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

/** Elapsed time counts up, so it rounds down instead. */
export function formatElapsed(milliseconds: number) {
  return formatClock(Math.floor(Math.max(0, milliseconds) / 1000) * 1000);
}
