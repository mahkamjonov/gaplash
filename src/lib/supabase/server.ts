import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/config/app";

import type { Database } from "./database.types";

/** A Supabase client acting as the signed-in user, so row-level security applies. */
export async function createClient() {
  // Supabase reads the clock to check token expiry, which Cache Components allows only at request time.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Cookies are read-only while a Server Component renders. The proxy refreshes the session.
        }
      },
    },
  });
}
