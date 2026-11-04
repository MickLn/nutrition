"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { startTargets, type Targets } from "@/engine/targets";
import { average7, weighInStatus, type WeighInStatus } from "@/engine/weight";
import { addDays } from "@/lib/dates";
import { db } from "@/lib/db";

import { loadProfile } from "@/features/profile/profile";
import { adjustTargets, loadRecords, totalAdjustment } from "@/features/review/adjustments";
import { ensureWeeklyAdjustment } from "@/features/review/auto-adjust";

export type BodyState = {
  targets: Targets | null;
  avgKg: number | null;
  /** Moyenne du jour moins celle d'il y a 7 jours. */
  delta7: number | null;
  status: WeighInStatus;
  daysSince: number | null;
};

/** Objectifs du jour : moteur de calcul + profil + moyenne des pesées sur 7 jours. Sans pesée, pas d'objectif. */
export function useBody(today: string): BodyState | undefined {
  // Le bilan de la semaine ajuste l'objectif tout seul : une fois par semaine, quel que soit l'écran ouvert (sans effet si déjà fait).
  const weighCount = useLiveQuery(() => db.weights.count(), []);
  useEffect(() => {
    if (weighCount) ensureWeeklyAdjustment(today).catch(() => {});
  }, [today, weighCount]);
  return useLiveQuery(async () => {
    const [profile, rows, records] = await Promise.all([loadProfile(), db.weights.toArray(), loadRecords()]);
    const weights = rows.map((w) => ({ date: w.date, kg: w.kg, at: w.updatedAt }));
    const avgKg = average7(weights, today);
    const before = average7(weights, addDays(today, -7));
    const last = rows.map((w) => w.date).filter((d) => d <= today).sort().pop();
    const daysSince = last ? Math.round((Date.parse(today) - Date.parse(last)) / 86_400_000) : null;
    return {
      // Cumul des ajustements automatiques du bilan, plancher compris.
      targets: avgKg === null ? null : adjustTargets(startTargets(profile, avgKg), profile, avgKg, totalAdjustment(records)),
      avgKg,
      delta7: avgKg !== null && before !== null ? avgKg - before : null,
      status: weighInStatus(weights, today),
      daysSince,
    };
  }, [today]);
}
