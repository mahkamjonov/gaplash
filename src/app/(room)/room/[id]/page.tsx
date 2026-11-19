import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { RoomSkeleton } from "@/components/room/room-skeleton";
import type { FreeTalkLevel } from "@/content/free-talk";
import { t } from "@/i18n";
import { isVideoConfigured } from "@/lib/livekit/token";
import { requireProfile } from "@/services/profile";
import type { Level } from "@/services/profile/types";
import { getRoom } from "@/services/room";

import { RoomLoader } from "./room-loader";

export const metadata: Metadata = { title: t.room.pageTitle };

const FREE_TALK_LEVEL: Record<Level, FreeTalkLevel> = { A2: "a2_b1", B1: "a2_b1", B2: "b2", C1: "c1" };

async function RoomGate({ params }: { params: PageProps<"/room/[id]">["params"] }) {
  const { id } = await params;
  const { profile } = await requireProfile(`/room/${id}`);

  // Only the two people in the session get a room; everyone else sees "not found".
  const room = await getRoom(id);
  if (!room) notFound();
  if (room.status === "completed" || room.status === "cancelled") redirect(`/sessions/${id}`);

  return (
    <RoomLoader
      snapshot={room}
      videoUrl={isVideoConfigured() ? (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? null) : null}
      defaultLevel={profile.level ? FREE_TALK_LEVEL[profile.level] : "b2"}
    />
  );
}

export default function RoomPage({ params }: PageProps<"/room/[id]">) {
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <RoomGate params={params} />
    </Suspense>
  );
}
