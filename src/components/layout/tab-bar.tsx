"use client";

import { Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getActiveNavIndex, navItems } from "@/config/navigation";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

function TabBarView({ activeIndex }: { activeIndex: number }) {
  return (
    <nav
      aria-label={t.nav.label}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-linear-to-t from-background via-background/80 to-transparent pt-6 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:hidden"
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-[1.75rem] border border-border bg-surface/90 p-1.5 shadow-lift backdrop-blur-xl">
        <div className="relative" style={{ "--active": activeIndex } as CSSProperties}>
          {activeIndex >= 0 ? (
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/3 translate-x-[calc(var(--active)*100%)] rounded-[1.375rem] bg-primary-tint transition-[translate] duration-300 ease-out"
            />
          ) : null}

          <ul className="relative grid grid-cols-3">
            {navItems.map(({ href, label, icon: Icon }, index) => {
              const active = index === activeIndex;

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center gap-0.5 rounded-[1.375rem] text-label font-medium transition-colors duration-200 ease-out",
                      active ? "font-semibold text-primary-ink" : "text-muted-foreground",
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
      </div>
    </nav>
  );
}

function CurrentTabBar() {
  return <TabBarView activeIndex={getActiveNavIndex(usePathname())} />;
}

/**
 * Floating bottom tab bar on mobile, below 768px. On dynamic routes the path is
 * unknown while prerendering, so the static shell has no active item.
 */
export function TabBar() {
  return (
    <Suspense fallback={<TabBarView activeIndex={-1} />}>
      <CurrentTabBar />
    </Suspense>
  );
}
