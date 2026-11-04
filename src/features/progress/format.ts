import { daysBetween } from "@/features/goal/goal";

/** Date AAAA-MM-JJ lue en heure locale. */
function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** « samedi 11 » (sans mois) ou « mercredi 14 oct. » (avec mois). */
export function dayName(locale: string, iso: string, withMonth = false): string {
  return new Intl.DateTimeFormat(locale, withMonth ? { weekday: "long", day: "numeric", month: "short" } : { weekday: "long", day: "numeric" }).format(parse(iso));
}

/** Repère de mois court (« sept. »). */
export function monthShort(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(parse(iso));
}

/** « jeudi » dans la semaine écoulée, sinon « 9 oct. ». */
export function recentDay(locale: string, iso: string, today: string, windowDays: number): string {
  if (daysBetween(iso, today) < windowDays) return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(parse(iso));
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(parse(iso));
}

/** Variation signée avec le vrai signe moins : « −2,5 », « +0,4 ». Un écart nul à l'arrondi n'a pas de signe. */
export function signed(format: (v: number, digits: number) => string, delta: number, digits = 1): string {
  const rounded = Math.round(Math.abs(delta) * 10 ** digits) / 10 ** digits;
  if (rounded === 0) return format(0, digits);
  return `${delta < 0 ? "−" : "+"}${format(rounded, digits)}`;
}
