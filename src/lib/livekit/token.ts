import "server-only";

import { AccessToken } from "livekit-server-sdk";

const API_KEY = process.env.LIVEKIT_API_KEY ?? "";
const API_SECRET = process.env.LIVEKIT_API_SECRET ?? "";

export const isVideoConfigured = () => Boolean(process.env.NEXT_PUBLIC_LIVEKIT_URL && API_KEY && API_SECRET);

/** A short-lived pass into one room, for one person. The secret never leaves the server. */
export function createVideoToken({ room, identity, name }: { room: string; identity: string; name: string }) {
  const token = new AccessToken(API_KEY, API_SECRET, { identity, name, ttl: "4h" });
  token.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  return token.toJwt();
}
