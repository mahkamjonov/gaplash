import { NextResponse, type NextRequest } from "next/server";

import { IS_MOCK_MODE, MOCK_COOKIE } from "@/config/app";
import { safeNextPath } from "@/lib/auth/next-path";
import { updateSession } from "@/lib/supabase/proxy";

async function resolveSession(request: NextRequest) {
  if (IS_MOCK_MODE) {
    return { response: NextResponse.next({ request }), isSignedIn: request.cookies.has(MOCK_COOKIE) };
  }
  return updateSession(request);
}

/** Redirects, keeping any refreshed auth cookies so the session is not lost. */
function redirectTo(url: URL, sessionResponse: NextResponse) {
  const response = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

/**
 * Keeps signed-out visitors out of the app and refreshes the auth session. This is a
 * first gate, not the only one: Server Actions and data reads check the user themselves.
 */
export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await resolveSession(request);
  const { pathname, search } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  // API routes answer signed-out callers with an error themselves; a redirect would be meaningless to fetch().
  const isPublic =
    isLoginPage || pathname.startsWith("/auth/") || pathname.startsWith("/dev/") || pathname.startsWith("/api/");

  if (!isSignedIn && !isPublic) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectTo(url, response);
  }

  if (isSignedIn && isLoginPage) {
    return redirectTo(new URL(safeNextPath(request.nextUrl.searchParams.get("next")), request.url), response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|__nextjs|.well-known|icon.svg|favicon.ico|robots.txt|sitemap.xml).*)"],
};
