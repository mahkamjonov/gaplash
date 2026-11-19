import { CalendarDays, House, UserRound, type LucideIcon } from "lucide-react";

import { t } from "@/i18n";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/home", label: t.nav.home, icon: House },
  { href: "/schedule", label: t.nav.schedule, icon: CalendarDays },
  { href: "/profile", label: t.nav.profile, icon: UserRound },
];

export function getActiveNavIndex(pathname: string) {
  return navItems.findIndex(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
}
