import "server-only";

import { connection } from "next/server";

/** The current time for this request. With Cache Components the clock may only be read after `connection()`. */
export async function requestNow() {
  await connection();
  return new Date();
}
