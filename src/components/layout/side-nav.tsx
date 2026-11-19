"use client";

import { Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Wordmark } from "@/components/brand/wordmark";
import { getActiveNavIndex, navItems } from "@/config/navigation";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

function SideNavView({ activeIndex }: { activeIndex: number }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-(--nav-width) flex-col gap-8 overflow-y-auto border-r border-border bg-surface py-6 pr-3 pl-[calc(0.75rem+env(safe-area-inset-left))] md:flex lg:pr-4 lg:pl-4">
      <Link href="/home" className="flex min-h-11 items-center justify-center rounded-input lg:justify-start lg:px-2">
        <Wordmark collapseBelowDesktop />
      </Link>

      <nav aria-label={t.nav.label}>
        <div
          className="relative [--item-gap:0.5rem] [--item-height:4.5rem] lg:[--item-height:3.25rem]"
          style={{ "--active": activeIndex } as CSSProperties}
        >
          {activeIndex >= 0 ? (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-(--item-height) translate-y-[calc(var(--active)*(var(--item-height)+var(--item-gap)))] rounded-input bg-primary-tint transition-[translate] duration-300 ease-out"
            />
          ) : null}

          <ul className="relative flex flex-col gap-(--item-gap)">
            {navItems.map(({ href, label, icon: Icon }, index) => {
              const active = index === activeIndex;

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-(--item-height) flex-col items-center justify-center gap-1 rounded-input text-label font-medium transition-colors duration-200 ease-out lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-body",
                      active ? "font-semibold text-primary-ink" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon aria-hidden className="size-6" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}

function CurrentSideNav() {
  return <SideNavView activeIndex={getActiveNavIndex(usePathname())} />;
}

/**
 * Icon rail on tablet (768px up), labelled sidebar on desktop (1200px up). On dynamic
 * routes the path is unknown while prerendering, so the static shell has no active item.
 */
export function SideNav() {
  return (
    <Suspense fallback={<SideNavView activeIndex={-1} />}>
      <CurrentSideNav />
    </Suspense>
  );
}
