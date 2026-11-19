import type { Metadata } from "next";

import { Mascot } from "@/components/brand/mascot";
import { t } from "@/i18n";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t.auth.signInTitle };

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-8 md:justify-start">
      <header className="flex flex-col items-center gap-3 pt-6 text-center md:pt-0">
        <Mascot mood="waving" size={96} />
        <h1 className="text-title">{t.auth.title}</h1>
        <p className="max-w-sm text-body text-pretty text-muted-foreground">{t.auth.subtitle}</p>
      </header>

      <LoginForm />
    </div>
  );
}
