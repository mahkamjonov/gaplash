import type { ReactNode } from "react";

import { SideNav } from "@/components/layout/side-nav";
import { TabBar } from "@/components/layout/tab-bar";
import { AmbientGlow } from "@/components/shared/ambient-glow";
import { t } from "@/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="[--nav-width:calc(5.5rem+env(safe-area-inset-left))] lg:[--nav-width:16.5rem]">
      <a
        href="#main"
        className="sr-only rounded-pill bg-surface font-semibold shadow-lift focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3"
      >
        {t.a11y.skipToContent}
      </a>

      <AmbientGlow />

      <SideNav />

      <main id="main" tabIndex={-1} className="outline-none md:pl-(--nav-width)">
        <div className="mx-auto w-full max-w-[calc(70rem+6rem)] pt-[calc(1.5rem+env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(7.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:px-8 md:pt-12 md:pb-16 lg:px-12">
          {children}
        </div>
      </main>

      <TabBar />
    </div>
  );
}
