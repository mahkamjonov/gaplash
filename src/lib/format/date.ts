import { t } from "@/i18n";

/** Most users are in Uzbekistan, so this is what the server renders before the browser's own zone is known. */
export const DEFAULT_TIME_ZONE = "Asia/Tashkent";

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(value("year")),
    month: Number(value("month")) - 1,
    day: Number(value("day")),
    time: `${value("hour")}:${value("minute")}`,
  };
}

function dayNumber({ year, month, day }: { year: number; month: number; day: number }) {
  return Date.UTC(year, month, day) / 86_400_000;
}

function monthDay(month: number, day: number) {
  return `${day}-${t.dates.months[month]}`;
}

/**
 * For example "Bugun · 19:00". Further away it is "5-noyabr, chorshanba · 19:00" ahead
 * of today, where the weekday helps planning, and "24-oktabr · 19:00" behind it.
 */
export function formatSessionTime(iso: string, now: Date, timeZone: string) {
  const target = partsInZone(new Date(iso), timeZone);
  const today = partsInZone(now, timeZone);
  const difference = dayNumber(target) - dayNumber(today);

  if (difference === 0) return `${t.dates.today} · ${target.time}`;
  if (difference === 1) return `${t.dates.tomorrow} · ${target.time}`;
  if (difference === -1) return `${t.dates.yesterday} · ${target.time}`;

  const year = target.year === today.year ? "" : ` ${target.year}`;
  const date = `${monthDay(target.month, target.day)}${year}`;
  if (difference < 0) return `${date} · ${target.time}`;

  const weekday = t.dates.weekdays[new Date(Date.UTC(target.year, target.month, target.day)).getUTCDay()];
  return `${date}, ${weekday} · ${target.time}`;
}

/** Formats a YYYY-MM-DD calendar date, for example "12-dekabr 2026". */
export function formatCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${monthDay(month - 1, day)} ${year}`;
}
