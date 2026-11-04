const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type Elapsed = { unit: "now" | "min" | "h" | "day"; n: number };

/** Temps écoulé depuis `at` (ms), dans l'unité la plus parlante : « à l'instant », minutes, heures, puis jours. */
export function elapsed(at: number, now: number): Elapsed {
  const d = Math.max(0, now - at);
  if (d < MINUTE) return { unit: "now", n: 0 };
  if (d < HOUR) return { unit: "min", n: Math.floor(d / MINUTE) };
  if (d < DAY) return { unit: "h", n: Math.floor(d / HOUR) };
  return { unit: "day", n: Math.floor(d / DAY) };
}

/** Jours entiers entre deux dates AAAA-MM-JJ (un changement d'heure ne fausse pas le compte). */
export function daysBetween(from: string, to: string): number {
  const ms = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(to) - ms(from)) / DAY);
}

export type Size = { n: number; digits: number; unit: "ko" | "mo" | "go" };

/** Taille lisible : ko sous 1 Mo, Mo (une décimale sous 10 Mo), Go avec une décimale. */
export function size(bytes: number): Size {
  const ko = Math.max(bytes, 0) / 1024;
  const mo = ko / 1024;
  const go = mo / 1024;
  if (go >= 1) return { n: go, digits: 1, unit: "go" };
  if (mo >= 1) return { n: mo, digits: mo < 10 ? 1 : 0, unit: "mo" };
  return { n: ko, digits: 0, unit: "ko" };
}
