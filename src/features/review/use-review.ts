"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useBody } from "@/features/body/use-targets";
import { adjustCapOf } from "@/features/goal/goal";
import { useProfile } from "@/features/profile/profile";
import { db } from "@/lib/db";
import { loadRecords } from "./adjustments";
import { buildWeek, reviewWeeks, type ReviewData, type WeekReview } from "./review";

export type Review = {
  /** Bilans disponibles, du plus récent au plus ancien. */
  weeks: WeekReview[];
};

/** Bilans de la semaine (moyennes, poids, tour de taille, ajustement proposé). Rien tant que l'objectif du jour n'existe pas (aucune pesée). */
export function useReview(today: string): Review | undefined {
  const body = useBody(today);
  const profile = useProfile();
  const data = useLiveQuery(async (): Promise<ReviewData> => {
    const [entries, water, weights, waists, records] = await Promise.all([
      db.logEntries.toArray(),
      db.water.toArray(),
      db.weights.toArray(),
      db.waists.toArray(),
      loadRecords(),
    ]);
    return { entries, water, weights: weights.map((w) => ({ date: w.date, kg: w.kg, at: w.updatedAt })), waists, records };
  }, []);
  if (!body || !profile || !data) return undefined;
  const targets = body.targets;
  if (!targets) return { weeks: [] };
  const starts = reviewWeeks(data, today);
  const ctx = { today, sex: profile.sex, capKcal: adjustCapOf(profile), currentKcal: targets.kcal, proteinG: targets.protein, waterL: targets.waterL };
  return { weeks: starts.map((s) => buildWeek(data, ctx, s)) };
}
