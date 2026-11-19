"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { IS_MOCK_MODE, MIN_PASSWORD_LENGTH } from "@/config/app";
import { t } from "@/i18n";

import { passwordAction, type PasswordState } from "./actions";

type Mode = "sign_in" | "sign_up";

/** Keeps the form on the page when the server cannot be reached, instead of falling to the error screen. */
async function passwordSafely(previous: PasswordState, formData: FormData): Promise<PasswordState> {
  try {
    return await passwordAction(previous, formData);
  } catch (error) {
    // A successful sign-in ends in a redirect, which Next signals with an error carrying a digest. Let it through.
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    return { status: "error", error: "network", email: String(formData.get("email") ?? "") };
  }
}

function PasswordFields({
  mode,
  next,
  email,
  onEmailChange,
  onSwitch,
}: {
  mode: Mode;
  next: string;
  email: string;
  onEmailChange: (email: string) => void;
  onSwitch: () => void;
}) {
  const [state, action] = useActionState(passwordSafely, { status: "idle" } satisfies PasswordState);
  const [showPassword, setShowPassword] = useState(false);

  const error = state.status === "error" ? state.error : null;
  const emailError = error === "invalid_email";
  const passwordError = error === "missing_password" || error === "weak_password";
  const isSignUp = mode === "sign_up";

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="intent" value={mode} />

      {IS_MOCK_MODE ? <Notice>{t.auth.mockPasswordNotice}</Notice> : null}
      {error && !emailError && !passwordError ? <Notice role="alert">{t.auth.passwordErrors[error]}</Notice> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t.auth.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete={isSignUp ? "email" : "username"}
          autoCapitalize="none"
          spellCheck={false}
          // Uncontrolled, so hydration keeps anything typed on a slow connection.
          defaultValue={state.status === "error" ? state.email : email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={t.auth.emailPlaceholder}
          aria-invalid={emailError || undefined}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError ? (
          <p id="email-error" role="alert" className="text-small text-warm-ink">
            {t.auth.passwordErrors.invalid_email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t.auth.passwordLabel}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
            className="pr-14"
            aria-invalid={passwordError || undefined}
            aria-describedby={passwordError ? "password-error" : isSignUp ? "password-hint" : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t.auth.showPassword}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        {passwordError && error ? (
          <p id="password-error" role="alert" className="text-small text-warm-ink">
            {t.auth.passwordErrors[error]}
          </p>
        ) : isSignUp ? (
          <p id="password-hint" className="text-small text-muted-foreground">
            {t.auth.passwordHint}
          </p>
        ) : null}
      </div>

      <SubmitButton className="w-full">{isSignUp ? t.auth.signUp : t.auth.signIn}</SubmitButton>
      <Button type="button" variant="ghost" size="md" className="w-full" onClick={onSwitch}>
        {isSignUp ? t.auth.toSignIn : t.auth.toSignUp}
      </Button>
    </form>
  );
}

export function PasswordForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");

  return (
    <PasswordFields
      // A fresh form for each mode, so an error from one never shows in the other.
      key={mode}
      mode={mode}
      next={next}
      email={email}
      onEmailChange={setEmail}
      onSwitch={() => setMode((current) => (current === "sign_in" ? "sign_up" : "sign_in"))}
    />
  );
}
