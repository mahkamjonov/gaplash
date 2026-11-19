import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { AuthService, MagicLinkError, PasswordError } from "./types";

function toPasswordError(error: { code?: string; status?: number }): PasswordError {
  if (error.status === 429 || error.code?.startsWith("over_")) return "rate_limited";
  if (error.code === "invalid_credentials") return "invalid_credentials";
  if (error.code === "user_already_exists" || error.code === "email_exists") return "email_taken";
  if (error.code === "weak_password") return "weak_password";
  if (error.code === "email_address_invalid") return "invalid_email";
  if (error.code === "email_not_confirmed") return "confirmation_required";
  if (!error.status) return "network";
  return "unknown";
}

function toMagicLinkError(error: { code?: string; status?: number }): MagicLinkError {
  if (error.status === 429 || error.code === "over_email_send_rate_limit") return "rate_limited";
  if (error.code === "email_address_invalid" || error.code === "validation_failed") return "invalid_email";
  if (!error.status) return "network";
  return "unknown";
}

function firstName(metadata: Record<string, unknown> | undefined) {
  const fullName = metadata?.full_name ?? metadata?.name;
  return typeof fullName === "string" ? (fullName.trim().split(/\s+/)[0] ?? null) : null;
}

export const supabaseAuthService: AuthService = {
  async getCurrentUser() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) return null;

    const { sub, email, user_metadata: metadata } = data.claims;
    return { id: sub, email: email ?? null, suggestedName: firstName(metadata) };
  },

  async signInWithPassword(email, password) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, error: toPasswordError(error) } : { ok: true };
  },

  async signUpWithPassword(email, password) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, error: toPasswordError(error) };
    // With "Confirm email" on in Supabase, sign-up sends an email and returns no session.
    return data.session ? { ok: true } : { ok: false, error: "confirmation_required" };
  },

  async sendMagicLink(email, redirectTo) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    return error ? { ok: false, error: toMagicLinkError(error) } : { ok: true };
  },

  async startGoogleSignIn(redirectTo) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    return error ? null : data.url;
  },

  async completeSignIn({ code, tokenHash }) {
    const supabase = await createClient();

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash });
      return !error;
    }
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return !error;
    }
    return false;
  },

  async signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
  },
};
