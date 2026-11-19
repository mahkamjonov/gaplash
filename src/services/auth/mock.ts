import "server-only";

import { clearMockState, readMockState, writeMockState } from "@/services/mock/store";

import type { AuthService } from "./types";

const DEMO_EMAIL = "sinov@gaplash.uz";

export const mockAuthService: AuthService = {
  async getCurrentUser() {
    const state = await readMockState();
    return state ? { id: "mock-user", email: state.email, suggestedName: null } : null;
  },

  async signInWithPassword(email) {
    await signInAsMockUser(email);
    return { ok: true };
  },

  async signUpWithPassword(email) {
    await signInAsMockUser(email);
    return { ok: true };
  },

  async sendMagicLink() {
    return { ok: true };
  },

  async startGoogleSignIn(redirectTo) {
    await signInAsMockUser(DEMO_EMAIL);
    const next = new URL(redirectTo).searchParams.get("next");
    return next ?? "/home";
  },

  async completeSignIn() {
    return false;
  },

  async signOut() {
    await clearMockState();
  },
};

export async function signInAsMockUser(email: string) {
  await writeMockState({ email, profile: null, scenario: "sample" });
}
