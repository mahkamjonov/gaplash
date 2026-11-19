import type { NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/http/same-origin";
import { createVideoToken, isVideoConfigured } from "@/lib/livekit/token";
import { getRoom } from "@/services/room";

const NO_STORE = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

/** A pass into a session's video room, for its two participants only. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!isVideoConfigured()) return json({ error: "video_unavailable" }, 503);

  const body = (await request.json().catch(() => null)) as { sessionId?: unknown } | null;
  let room;
  try {
    room = typeof body?.sessionId === "string" ? await getRoom(body.sessionId) : null;
  } catch {
    return json({ error: "unavailable" }, 503);
  }
  if (!room) return json({ error: "not_found" }, 404);
  if (room.status === "completed" || room.status === "cancelled") return json({ error: "closed" }, 409);

  const token = await createVideoToken({ room: room.sessionId, identity: room.me.id, name: room.me.name });
  return json({ token });
}
