const DEFAULT_PATH = "/home";

/**
 * Returns a path that is safe to redirect to after sign-in, or the default. The value
 * comes from the URL, so anything that could leave this site is rejected: full URLs,
 * protocol-relative paths like //evil.com, and the backslash forms browsers treat alike.
 */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return DEFAULT_PATH;
  if (value.includes("\\") || /[\u0000-\u001f]/.test(value)) return DEFAULT_PATH;

  const base = "http://internal.invalid";
  try {
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : DEFAULT_PATH;
  } catch {
    return DEFAULT_PATH;
  }
}

export function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
