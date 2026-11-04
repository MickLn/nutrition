import type { Profile, Sex } from "@/config/profile";
import { REVIEW } from "@/config/review";
import { KCAL_FLOOR, macrosFor, type Targets } from "@/engine/targets";
import { addDays } from "@/lib/dates";
import { db } from "@/lib/db";

/** Un ajustement proposé par le bilan et la réponse donnée. `week` = premier jour de la semaine du bilan. */
export type AdjustmentRecord = {
  week: string;
  /** Date de la réponse (AAAA-MM-JJ). */
  at: string;
  delta: number;
  kcalBefore: number;
  kcalAfter: number;
  status: "accepted" | "refused";
};

export function parseRecords(v: unknown): AdjustmentRecord[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (r): r is AdjustmentRecord =>
      !!r && typeof r.week === "string" && typeof r.at === "string" && Number.isFinite(r.delta) && (r.status === "accepted" || r.status === "refused"),
  );
}

export async function loadRecords(): Promise<AdjustmentRecord[]> {
  return parseRecords((await db.settings.get(REVIEW.settingsKey))?.value).sort((a, b) => a.week.localeCompare(b.week));
}

/** Cumul des ajustements acceptés, en kcal par jour. */
export function totalAdjustment(records: AdjustmentRecord[]): number {
  return records.filter((r) => r.status === "accepted").reduce((s, r) => s + r.delta, 0);
}

/** Objectif avec le cumul des ajustements acceptés ; le plancher l'emporte toujours. */
export function applyAdjustments(kcal: number, total: number, sex: Sex): number {
  return total === 0 ? kcal : Math.max(kcal + total, KCAL_FLOOR[sex]);
}

/** Cible du jour avec le cumul des ajustements : kcal ajustées, glucides recalculés (protéines et lipides suivent le profil). */
export function adjustTargets(t: Targets, profile: Profile, avgKg: number, total: number): Targets {
  if (total === 0) return t;
  const kcal = applyAdjustments(t.kcal, total, profile.sex);
  return { ...t, kcal, ...macrosFor(kcal, profile, avgKg), floorApplied: t.floorApplied || kcal === KCAL_FLOOR[profile.sex] };
}

/** Objectif en vigueur pendant la semaine : on retire les ajustements décidés à partir de son bilan. */
export function kcalAtWeek(currentKcal: number, records: AdjustmentRecord[], week: string): number {
  return currentKcal - totalAdjustment(records.filter((r) => r.week >= week));
}

/** Un ajustement accepté récemment bloque une nouvelle proposition (cooldownDays). */
export function inCooldown(records: AdjustmentRecord[], today: string): boolean {
  const last = records
    .filter((r) => r.status === "accepted")
    .map((r) => r.at)
    .sort()
    .pop();
  return !!last && addDays(last, REVIEW.cooldownDays.value) > today;
}

/** Enregistre la réponse à un bilan (remplace l'éventuelle réponse précédente pour la même semaine). */
export async function answerAdjustment(record: AdjustmentRecord): Promise<void> {
  const all = (await loadRecords()).filter((r) => r.week !== record.week);
  await db.settings.put({ key: REVIEW.settingsKey, value: [...all, record] });
}
