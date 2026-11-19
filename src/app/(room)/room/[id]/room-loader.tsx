"use client";

import dynamic from "next/dynamic";

import type { RoomAppProps } from "@/components/room/room-app";
import { RoomSkeleton } from "@/components/room/room-skeleton";

// The video SDK is large, so it loads only here, and only in the browser.
const RoomApp = dynamic(() => import("@/components/room/room-app").then((module) => module.RoomApp), {
  ssr: false,
  loading: () => <RoomSkeleton />,
});

export function RoomLoader(props: RoomAppProps) {
  return <RoomApp {...props} />;
}
