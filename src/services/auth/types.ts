export type AuthUser = {
  id: string;
  email: string | null;
  /** First name from the identity provider, to prefill onboarding. */
  suggestedName: string | null;
};

export type MagicLinkError = "invalid_email" | "rate_limited" | "network" | "unknown";

export type MagicLinkResult = { ok: true } | { ok: false; error: MagicLinkError };

export type PasswordError =
  | "invalid_email"
  | "missing_password"
  | "weak_password"
  | "invalid_credentials"
  | "email_taken"
  | "confirmation_required"
  | "rate_limited"
  | "network"
  | "unknown";

export type PasswordResult = { ok: true } | { ok: false; error: PasswordError };

export type SignInProof = {
  /** From the PKCE flow: Google sign-in and the default email template. */
  code: string | null;
  /** From a customised email template. Works in a different browser than the one that asked for the link. */
  tokenHash: string | null;
};

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithPassword(email: string, password: string): Promise<PasswordResult>;
  signUpWithPassword(email: string, password: string): Promise<PasswordResult>;
  sendMagicLink(email: string, redirectTo: string): Promise<MagicLinkResult>;
  /** Returns where to send the browser next, or null if sign-in could not start. */
  startGoogleSignIn(redirectTo: string): Promise<string | null>;
  completeSignIn(proof: SignInProof): Promise<boolean>;
  signOut(): Promise<void>;
}
