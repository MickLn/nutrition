import { z } from "zod";
import { HEALTH } from "@/config/health";
import { UI } from "@/config/ui";
import { addDays } from "@/lib/dates";

export type HealthWeight = { date: string; kg: number };
export type HealthError = "empty" | "format" | "kg" | "future" | "old" | "many";
export type HealthParse = { ok: true; items: HealthWeight[] } | { ok: false; error: HealthError };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KG = /^\d{2,3}(?:[.,]\d{1,2})?$/;
const kgSchema = z.number().min(UI.weightKg.min).max(UI.weightKg.max);

/** Date AAAA-MM-JJ qui existe vraiment (pas le 31 février). */
function realDate(s: string): boolean {
  if (!DATE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Lit « 72.4 » ou « 72,4 » (format strict : pas d'unité, pas d'espace). */
function parseKg(s: string): number | null {
  return KG.test(s) ? Number(s.replace(",", ".")) : null;
}

/**
 * Lit les pesées d'un fragment d'URL (`#kg=72.4&date=2026-11-04` ou `#w=2026-11-03:72.6,2026-11-04:72.4`).
 * Un `?` initial est aussi accepté. Tout ou rien : une seule valeur invalide refuse tout le lot.
 */
export function parseHealthParams(raw: string, today: string): HealthParse {
  const params = new URLSearchParams(raw.replace(/^[#?]/, ""));
  const w = params.get("w");
  const kg = params.get("kg");
  let pairs: [string, string][];
  if (w !== null) {
    pairs = w
      .split(",")
      .filter((p) => p !== "")
      .map((p) => {
        const i = p.indexOf(":");
        return (i < 0 ? [p, ""] : [p.slice(0, i), p.slice(i + 1)]) as [string, string];
      });
  } else if (kg !== null) {
    pairs = [[params.get("date") ?? today, kg]];
  } else {
    return { ok: false, error: "empty" };
  }
  if (pairs.length === 0) return { ok: false, error: "empty" };
  if (pairs.length > HEALTH.maxBatch) return { ok: false, error: "many" };

  const oldest = addDays(today, -HEALTH.maxAgeDays);
  const items: HealthWeight[] = [];
  for (const [date, kgText] of pairs) {
    const value = parseKg(kgText);
    if (!realDate(date) || value === null) return { ok: false, error: "format" };
    if (!kgSchema.safeParse(value).success) return { ok: false, error: "kg" };
    if (date > today) return { ok: false, error: "future" };
    if (date < oldest) return { ok: false, error: "old" };
    items.push({ date, kg: value });
  }
  return { ok: true, items };
}

/** Retire les pesées en double dans le lot lui-même (même date et même poids). */
export function uniqueWeights(items: HealthWeight[]): HealthWeight[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.date}|${i.kg}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Adresse modèle à coller dans le Raccourci (les crochets sont remplacés par le Raccourci). */
export function templateUrl(origin: string): string {
  return `${origin}${HEALTH.path}#kg=[poids]&date=[date]`;
}
