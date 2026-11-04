import { weeklyAdjust } from "@/engine/adjust";
import { startTargets } from "@/engine/targets";
import { average7, type WeighIn } from "@/engine/weight";
import { adjustCapOf } from "@/features/goal/goal";
import { loadProfile } from "@/features/profile/profile";
import type { Profile } from "@/config/profile";
import { REVIEW } from "@/config/review";
import { addDays } from "@/lib/dates";
import { db } from "@/lib/db";
import { adjustTargets, loadRecords, totalAdjustment, type AdjustmentRecord } from "./adjustments";
import { reviewWeeks, weekEndOf, weekStartOf } from "./review";

/**
 * Ajustement de la dernière semaine terminée, ou null s'il n'y a rien à enregistrer :
 * pas de bilan disponible, bilan d'une semaine plus ancienne (on ne rattrape pas), ou semaine déjà enregistrée.
 */
export function planAdjustment(today: string, profile: Profile, weights: WeighIn[], records: AdjustmentRecord[]): AdjustmentRecord | null {
  const avgKg = average7(weights, today);
  const week = addDays(weekStartOf(today), -7);
  if (avgKg === null || reviewWeeks({ weights }, today)[0] !== week) return null;
  if (records.some((r) => r.week === week)) return null;
  const current = adjustTargets(startTargets(profile, avgKg), profile, avgKg, totalAdjustment(records)).kcal;
  const adj = weeklyAdjust({ currentKcal: current, sex: profile.sex, weights, today: weekEndOf(week), capKcal: adjustCapOf(profile) });
  return { week, at: today, delta: adj.delta, kcalBefore: current, kcalAfter: adj.newKcal, reason: adj.reason };
}

/**
 * Enregistre l'ajustement automatique de la dernière semaine terminée (décisions : pas de validation).
 * Lecture et écriture dans une seule transaction : une semaine n'est enregistrée qu'une fois, même si
 * plusieurs écrans l'appellent en même temps. Renvoie la ligne écrite, ou null.
 */
export function ensureWeeklyAdjustment(today: string): Promise<AdjustmentRecord | null> {
  return db.transaction("rw", db.settings, db.weights, async () => {
    const [profile, rows, records] = await Promise.all([loadProfile(), db.weights.toArray(), loadRecords()]);
    const weights = rows.map((w) => ({ date: w.date, kg: w.kg, at: w.updatedAt }));
    const record = planAdjustment(today, profile, weights, records);
    if (record) await db.settings.put({ key: REVIEW.settingsKey, value: [...records, record] });
    return record;
  });
}
