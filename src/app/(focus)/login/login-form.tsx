"use client";

import { useActionState, useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { MailCheck } from "lucide-react";

import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { IS_MOCK_MODE, SIGN_IN_METHODS } from "@/config/app";
import { t } from "@/i18n";

import {
  continueInMockModeAction,
  sendMagicLinkAction,
  signInWithGoogleAction,
  type MagicLinkState,
} from "./actions";
import { PasswordForm } from "./password-form";

const RESEND_COOLDOWN_SECONDS = 60;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.36c1.61 0 3.06.55 4.2 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.67 2.84C6.72 7.29 9.14 5.36 12 5.36Z"
      />
    </svg>
  );
}

/** Keeps the form on the page when the server cannot be reached, instead of falling to the error screen. */
async function sendMagicLinkSafely(previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  try {
    return await sendMagicLinkAction(previous, formData);
  } catch {
    return { status: "error", error: "network", email: String(formData.get("email") ?? "") };
  }
}

function useResendCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  return [secondsLeft, () => setSecondsLeft(RESEND_COOLDOWN_SECONDS)] as const;
}

function CheckEmail({
  email,
  next,
  resendAction,
  onChangeEmail,
}: {
  email: string;
  next: string;
  resendAction: (formData: FormData) => void;
  onChangeEmail: () => void;
}) {
  const [secondsLeft, restartCooldown] = useResendCooldown();

  return (
    <div className="flex animate-page-enter flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-tint text-primary-ink">
          <MailCheck aria-hidden className="size-7" />
        </span>
        <h2 className="text-heading">{t.auth.checkTitle}</h2>
        <p className="text-body text-pretty wrap-anywhere text-muted-foreground">{t.auth.checkDescription(email)}</p>
      </div>

      {IS_MOCK_MODE ? (
        <form action={continueInMockModeAction} className="flex flex-col gap-3">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <Notice>{t.auth.mockNotice}</Notice>
          <SubmitButton className="w-full">{t.auth.mockContinue}</SubmitButton>
        </form>
      ) : null}

      <div className="flex flex-col gap-2">
        <form action={resendAction} onSubmit={restartCooldown}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <SubmitButton variant="secondary" size="md" className="w-full" disabled={secondsLeft > 0}>
            <span className="tabular-nums">{secondsLeft > 0 ? t.auth.resendIn(secondsLeft) : t.auth.resend}</span>
          </SubmitButton>
        </form>
        <Button type="button" variant="ghost" size="md" className="w-full" onClick={onChangeEmail}>
          {t.auth.changeEmail}
        </Button>
      </div>
    </div>
  );
}

function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogleAction}>
      <input type="hidden" name="next" value={next} />
      <SubmitButton variant="outline" className="w-full">
        <GoogleIcon />
        {t.auth.google}
      </SubmitButton>
    </form>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 text-small text-muted-foreground">
      <span aria-hidden className="h-px flex-1 bg-border" />
      {t.auth.or}
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}

function MagicLinkForm({
  next,
  defaultEmail,
  onChangeEmail,
}: {
  next: string;
  defaultEmail: string;
  onChangeEmail: (email: string) => void;
}) {
  const [state, action] = useActionState(sendMagicLinkSafely, { status: "idle" } satisfies MagicLinkState);

  if (state.status === "sent") {
    return (
      <CheckEmail email={state.email} next={next} resendAction={action} onChangeEmail={() => onChangeEmail(state.email)} />
    );
  }

  const error = state.status === "error" ? state.error : null;
  const isEmailError = error === "invalid_email";

  return (
    <div className="flex flex-col gap-6">
      {error && !isEmailError ? <Notice role="alert">{t.auth.errors[error]}</Notice> : null}

      <form action={action} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t.auth.emailLabel}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            // Uncontrolled, so hydration keeps anything typed on a slow connection. React resets the
            // field after an action, so the typed value comes back through the action state.
            defaultValue={state.status === "error" ? state.email : defaultEmail}
            placeholder={t.auth.emailPlaceholder}
            aria-invalid={isEmailError || undefined}
            aria-describedby={isEmailError ? "email-error" : "email-hint"}
          />
          {isEmailError ? (
            <p id="email-error" role="alert" className="text-small text-warm-ink">
              {t.auth.errors.invalid_email}
            </p>
          ) : (
            <p id="email-hint" className="text-small text-muted-foreground">
              {t.auth.noPassword}
            </p>
          )}
        </div>
        <SubmitButton className="w-full">{t.auth.sendLink}</SubmitButton>
      </form>
    </div>
  );
}

const subscribeToNothing = () => () => {};

/**
 * Reads a URL parameter in the browser. `useSearchParams` would need a Suspense boundary,
 * and swapping out its fallback during hydration wipes anything typed on a slow connection.
 */
function useUrlParam(name: string) {
  return useSyncExternalStore(
    subscribeToNothing,
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}

export function LoginForm() {
  const next = useUrlParam("next") ?? "/home";
  const linkError = useUrlParam("error") === "link";

  const [formKey, setFormKey] = useState(0);
  const [email, setEmail] = useState("");

  // Next keeps this route alive while hidden, so reset it or a returning user would see a stale "check your email".
  useLayoutEffect(
    () => () => {
      setEmail("");
      setFormKey((key) => key + 1);
    },
    [],
  );

  const methods = [
    SIGN_IN_METHODS.password ? <PasswordForm key={`password-${formKey}`} next={next} /> : null,
    SIGN_IN_METHODS.google ? <GoogleButton key="google" next={next} /> : null,
    SIGN_IN_METHODS.magicLink ? (
      <MagicLinkForm
        key={`magic-${formKey}`}
        next={next}
        defaultEmail={email}
        onChangeEmail={(previousEmail) => {
          setEmail(previousEmail);
          setFormKey((key) => key + 1);
        }}
      />
    ) : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      {linkError ? <Notice role="alert">{t.auth.errors.link}</Notice> : null}
      {methods.map((method, index) => (
        <div key={index} className="flex flex-col gap-6">
          {index > 0 ? <Divider /> : null}
          {method}
        </div>
      ))}
    </div>
  );
}
