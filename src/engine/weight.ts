import { RULES } from "@/config/rules";
import { addDays } from "@/lib/dates";

export type WeighIn = { date: string; kg: number; at?: number };

/** Une pesée par jour : la dernière du jour (champ `at`, sinon l'ordre de la liste). */
function lastPerDay(weights: WeighIn[]): Map<string, number> {
  const byDay = new Map<string, WeighIn>();
  for (const w of weights) {
    const prev = byDay.get(w.date);
    if (!prev || (w.at ?? 0) >= (prev.at ?? 0)) byDay.set(w.date, w);
  }
  return new Map([...byDay].map(([d, w]) => [d, w.kg]));
}

/** Moyenne des pesées des 7 jours finissant `today` (inclus). null si aucune pesée. */
export function average7(weights: WeighIn[], today: string): number | null {
  const days = lastPerDay(weights);
  const from = addDays(today, -6);
  const kgs = [...days].filter(([d]) => d >= from && d <= today).map(([, kg]) => kg);
  return kgs.length ? kgs.reduce((a, b) => a + b, 0) / kgs.length : null;
}

export function trendSeries(weights: WeighIn[], from: string, to: string): { date: string; avg: number | null }[] {
  const out: { date: string; avg: number | null }[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ date: d, avg: average7(weights, d) });
  return out;
}

export type WeighInStatus = "ok" | "late" | "incomplete";

/** « late » après 2 jours sans pesée, « incomplete » après 7. Aucune pesée : « incomplete ». */
export function weighInStatus(weights: WeighIn[], today: string): WeighInStatus {
  const past = weights.map((w) => w.date).filter((d) => d <= today).sort();
  if (!past.length) return "incomplete";
  const last = past[past.length - 1];
  if (last <= addDays(today, -RULES.weighInIncompleteDays.value)) return "incomplete";
  if (last <= addDays(today, -RULES.weighInLateDays.value)) return "late";
  return "ok";
}
