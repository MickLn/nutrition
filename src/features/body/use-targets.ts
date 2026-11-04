"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { DEFAULT_PROFILE, profileSchema, type Profile } from "@/config/profile";
import { startTargets, type Targets } from "@/engine/targets";
import { average7, weighInStatus, type WeighInStatus } from "@/engine/weight";
import { addDays } from "@/lib/dates";
import { db } from "@/lib/db";

/** Réglage où est rangé le profil (rempli plus tard par Moi › Profil). */
export const PROFILE_KEY = "profile";

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
  return useLiveQuery(async () => {
    const [stored, rows] = await Promise.all([db.settings.get(PROFILE_KEY), db.weights.toArray()]);
    const parsed = profileSchema.safeParse(stored?.value);
    const profile = parsed.success ? (parsed.data as Profile) : DEFAULT_PROFILE;
    const weights = rows.map((w) => ({ date: w.date, kg: w.kg, at: w.updatedAt }));
    const avgKg = average7(weights, today);
    const before = average7(weights, addDays(today, -7));
    const last = rows.map((w) => w.date).filter((d) => d <= today).sort().pop();
    const daysSince = last ? Math.round((Date.parse(today) - Date.parse(last)) / 86_400_000) : null;
    return {
      targets: avgKg === null ? null : startTargets(profile, avgKg),
      avgKg,
      delta7: avgKg !== null && before !== null ? avgKg - before : null,
      status: weighInStatus(weights, today),
      daysSince,
    };
  }, [today]);
}
