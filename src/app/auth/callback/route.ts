import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/next-path";
import { completeSignIn } from "@/services/auth";
import { getProfile } from "@/services/profile";

/** Where magic links and Google sign-in land. Finishes the sign-in, then sends the user on. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));

  const signedIn = await completeSignIn({
    code: searchParams.get("code"),
    tokenHash: searchParams.get("token_hash"),
  });

  if (!signedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "link");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // Going straight to onboarding here spares new users a flash of the app shell.
  const profile = await getProfile();
  const destination = profile ? next : `/onboarding?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(destination, request.url));
}
