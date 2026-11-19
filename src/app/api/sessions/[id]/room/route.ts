import type { NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/http/same-origin";
import { isValidRoomState } from "@/lib/room/validate";
import { getRoom, updateRoom, type RoomSnapshot } from "@/services/room";

const NO_STORE = { "cache-control": "no-store" };
const MAX_BODY_BYTES = 32_768;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

/** The database could not be reached: the page keeps its state and tries again. */
async function readRoom(id: string) {
  try {
    return { room: await getRoom(id) };
  } catch {
    return { unavailable: true as const };
  }
}

/** What the room page needs to stay in step: state, version and who is in it. */
function publicRoom(room: RoomSnapshot) {
  return {
    state: room.state,
    version: room.version,
    status: room.status,
    serverNow: room.serverNow,
    partner: room.partner,
  };
}

export async function GET(_request: NextRequest, context: RouteContext<"/api/sessions/[id]/room">) {
  const { id } = await context.params;
  const result = await readRoom(id);
  if ("unavailable" in result) return json({ error: "unavailable" }, 503);
  return result.room ? json(publicRoom(result.room)) : json({ error: "not_found" }, 404);
}

export async function POST(request: NextRequest, context: RouteContext<"/api/sessions/[id]/room">) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);

  const { id } = await context.params;
  const read = await readRoom(id);
  if ("unavailable" in read) return json({ error: "unavailable" }, 503);
  const room = read.room;
  if (!room) return json({ error: "not_found" }, 404);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const expectedVersion = body?.expectedVersion;
  const status = body?.status ?? null;
  const participants = [room.me.id, room.partner?.id].filter((value): value is string => Boolean(value));

  if (
    !Number.isInteger(expectedVersion) ||
    (status !== null && status !== "live" && status !== "completed") ||
    !isValidRoomState(body?.state, participants)
  ) {
    return json({ error: "bad_request" }, 400);
  }

  const result = await updateRoom(id, expectedVersion as number, body.state, status);
  return result ? json(result) : json({ error: "closed" }, 409);
}
