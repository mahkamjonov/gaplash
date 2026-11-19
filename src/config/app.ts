/** The product name. Change it here and it changes everywhere. */
export const APP_NAME = "Gaplash";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * Without Supabase keys the app runs on sample data with a pretend sign-in, so it
 * can be developed and reviewed with no backend. As soon as keys are set this mode
 * is off and every read and write goes through real auth and row-level security.
 * Creating sessions and the live room need the real backend.
 */
export const IS_MOCK_MODE = !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY;

export const MOCK_COOKIE = "gaplash_mock";

/** The LiveKit server for audio and video. Without it the room still runs, with no media. */
export const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";

/**
 * Sign-in methods on the login page. While the app is in testing it uses email and password;
 * email links and Google are built and tested, and can be switched back on here.
 */
export const SIGN_IN_METHODS = { password: true, magicLink: false, google: false } as const;

export const MIN_PASSWORD_LENGTH = 8;
