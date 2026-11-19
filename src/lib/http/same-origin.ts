/**
 * For JSON endpoints that change data. Browsers always send Origin on these requests, so a
 * missing or foreign Origin means the request did not come from this app's own pages.
 */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
