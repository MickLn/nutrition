import type { AdjustCap, Sex } from "@/config/profile";
import { REVIEW } from "@/config/review";
import { weeklyAdjust, type Adjustment } from "@/engine/adjust";
import { average7, type WeighIn } from "@/engine/weight";
import { addDays } from "@/lib/dates";
import type { LogEntry, Water } from "@/lib/db";
import { sumMacros } from "@/lib/nutrition";
import { kcalAtWeek, type AdjustmentRecord } from "./adjustments";

/** Premier jour (lundi par défaut) de la semaine qui contient `iso`. */
export function weekStartOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return addDays(iso, -((dow - REVIEW.weekStartDay.value + 7) % 7));
}

export const weekEndOf = (start: string) => addDays(start, 6);

export type ReviewData = {
  entries: Pick<LogEntry, "date" | "grams" | "snapshot">[];
  water: Pick<Water, "date" | "ml">[];
  weights: (WeighIn & { date: string })[];
  waists: { date: string; cm: number }[];
  records: AdjustmentRecord[];
};

export type ReviewContext = {
  today: string;
  sex: Sex;
  capKcal: AdjustCap;
  /** Objectif calorique en vigueur aujourd'hui (ajustements acceptés compris). */
  currentKcal: number;
  proteinG: number;
  waterL: number;
};

/** Semaines terminées dont le bilan est disponible aujourd'hui et qui ont assez de pesées, de la plus récente à la plus ancienne. */
export function reviewWeeks(data: Pick<ReviewData, "weights">, today: string): string[] {
  const out: string[] = [];
  const first = data.weights.map((w) => w.date).sort()[0];
  if (!first) return out;
  let start = weekStartOf(today);
  // Une semaine est disponible `availableAfterDays` jours après son dernier jour.
  if (addDays(weekEndOf(start), REVIEW.availableAfterDays.value) > today) start = addDays(start, -7);
  for (; weekEndOf(start) >= first && out.length < REVIEW.listWeeks.value; start = addDays(start, -7)) {
    const end = weekEndOf(start);
    const count = new Set(data.weights.filter((w) => w.date >= start && w.date <= end).map((w) => w.date)).size;
    if (count >= REVIEW.minWeighIns.value) out.push(start);
  }
  return out;
}

export type WeekReview = {
  start: string;
  end: string;
  /** Jours avec au moins une saisie. */
  loggedDays: number;
  avgKcal: number | null;
  avgProtein: number | null;
  proteinDays: number;
  waterDays: number;
  weightKg: number | null;
  /** Moyenne 7 jours de la fin de semaine moins celle de la semaine d'avant. */
  weightDelta: number | null;
  waistCm: number | null;
  waistDelta: number | null;
  kcalTarget: number;
  proteinTarget: number;
  /** Moyenne du poids stable depuis 3 semaines (écran dédié du Figma). */
  plateau: boolean;
  /** Objectif après le bilan (= kcalTarget si rien ne change). */
  kcalAfter: number;
  /** Ce que le bilan a changé : vrai si l'objectif a bougé (ajustement automatique déjà enregistré). */
  changed: boolean;
  /** Raison de l'ajustement (clé `adjust.*`). */
  reason: Adjustment["reason"];
};

/** Moyenne affichée « avec tolérance » : vraie seulement si le réglage est activé et la moyenne dans la marge. */
export function withinTolerance(avg: number, target: number): boolean {
  const { enabled, pct } = REVIEW.tolerance;
  return enabled && Math.abs(avg - target) <= target * pct;
}

export function buildWeek(data: ReviewData, ctx: ReviewContext, start: string): WeekReview {
  const end = weekEndOf(start);
  const inWeek = <T extends { date: string }>(rows: T[]) => rows.filter((r) => r.date >= start && r.date <= end);

  const byDay = new Map<string, typeof data.entries>();
  for (const e of inWeek(data.entries)) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
  const days = [...byDay.values()].map((es) => sumMacros(es));
  const loggedDays = days.length;
  const avg = (f: (c: (typeof days)[number]) => number) => (loggedDays ? days.reduce((s, c) => s + f(c), 0) / loggedDays : null);

  const waterByDay = new Map<string, number>();
  for (const w of inWeek(data.water)) waterByDay.set(w.date, (waterByDay.get(w.date) ?? 0) + w.ml);

  const weightKg = average7(data.weights, end);
  const before = average7(data.weights, addDays(end, -7));
  const waists = [...data.waists].sort((a, b) => a.date.localeCompare(b.date));
  const waistNow = waists.filter((w) => w.date <= end).pop();
  const waistBefore = waists.filter((w) => w.date < start).pop();

  const record = data.records.find((r) => r.week === start);
  const kcalTarget = record?.kcalBefore ?? kcalAtWeek(ctx.currentKcal, data.records, start);
  const adjustment = weeklyAdjust({ currentKcal: kcalTarget, sex: ctx.sex, weights: data.weights, today: end, capKcal: ctx.capKcal });
  // L'ajustement est appliqué automatiquement (auto-adjust.ts) : le bilan montre ce qui a été enregistré.
  const kcalAfter = record ? record.kcalAfter : kcalTarget;

  return {
    start,
    end,
    loggedDays,
    avgKcal: avg((c) => c.kcal),
    avgProtein: avg((c) => c.protein),
    proteinDays: days.filter((c) => c.protein >= ctx.proteinG).length,
    waterDays: [...waterByDay.values()].filter((ml) => ml >= ctx.waterL * 1000).length,
    weightKg,
    weightDelta: weightKg !== null && before !== null ? weightKg - before : null,
    waistCm: waistNow?.cm ?? null,
    waistDelta: waistNow && waistBefore ? waistNow.cm - waistBefore.cm : null,
    kcalTarget,
    proteinTarget: ctx.proteinG,
    plateau: adjustment.reason === "stalled-3w",
    kcalAfter,
    changed: kcalAfter !== kcalTarget,
    reason: adjustment.reason,
  };
}
