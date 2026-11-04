import type { Profile, Sex } from "@/config/profile";
import { REVIEW } from "@/config/review";
import { KCAL_FLOOR, macrosFor, type Targets } from "@/engine/targets";
import { db } from "@/lib/db";

/** Ajustement calculé à l'ouverture d'un bilan et appliqué automatiquement. `week` = premier jour de la semaine du bilan (une seule ligne par semaine). */
export type AdjustmentRecord = {
  week: string;
  /** Date de l'enregistrement (AAAA-MM-JJ). */
  at: string;
  /** Écart en kcal/jour (0 = l'objectif ne bouge pas). */
  delta: number;
  kcalBefore: number;
  kcalAfter: number;
  /** Raison donnée par le moteur (`adjust.*`). */
  reason: string;
};

export function parseRecords(v: unknown): AdjustmentRecord[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (r): r is AdjustmentRecord =>
      !!r && typeof r.week === "string" && typeof r.at === "string" && Number.isFinite(r.delta) && Number.isFinite(r.kcalBefore) && Number.isFinite(r.kcalAfter),
  );
}

export async function loadRecords(): Promise<AdjustmentRecord[]> {
  return parseRecords((await db.settings.get(REVIEW.settingsKey))?.value).sort((a, b) => a.week.localeCompare(b.week));
}

/** Cumul des ajustements enregistrés, en kcal par jour. */
export function totalAdjustment(records: AdjustmentRecord[]): number {
  return records.reduce((s, r) => s + r.delta, 0);
}

/** Objectif avec le cumul des ajustements ; le plancher l'emporte toujours. */
export function applyAdjustments(kcal: number, total: number, sex: Sex): number {
  return total === 0 ? kcal : Math.max(kcal + total, KCAL_FLOOR[sex]);
}

/** Cible du jour avec le cumul des ajustements : kcal ajustées, glucides recalculés (protéines et lipides suivent le profil). */
export function adjustTargets(t: Targets, profile: Profile, avgKg: number, total: number): Targets {
  if (total === 0) return t;
  const kcal = applyAdjustments(t.kcal, total, profile.sex);
  return { ...t, kcal, ...macrosFor(kcal, profile, avgKg), floorApplied: t.floorApplied || kcal === KCAL_FLOOR[profile.sex] };
}

/** Objectif en vigueur pendant la semaine : on retire les ajustements enregistrés à partir de son bilan. */
export function kcalAtWeek(currentKcal: number, records: AdjustmentRecord[], week: string): number {
  return currentKcal - totalAdjustment(records.filter((r) => r.week >= week));
}
