import { RULES } from "@/config/rules";
import type { Sex } from "@/config/profile";
import { addDays } from "@/lib/dates";
import { KCAL_FLOOR } from "./targets";
import { average7, type WeighIn } from "./weight";

export type AdjustCap = (typeof RULES.adjustCaps.value)[number];

export type AdjustInput = {
  currentKcal: number;
  sex: Sex;
  weights: WeighIn[];
  today: string;
  capKcal: AdjustCap;
};

export type AdjustReason = "not-enough-data" | "on-track" | "stalled-2w" | "stalled-3w" | "too-fast" | "floor";

export type Adjustment = {
  newKcal: number;
  delta: number;
  reason: AdjustReason;
  /** Clé de la phrase d'explication dans les fichiers de langue. */
  explanationKey: `adjust.${AdjustReason}`;
  kind: "conception";
};

function result(currentKcal: number, newKcal: number, reason: AdjustReason): Adjustment {
  return { newKcal, delta: newKcal - currentKcal, reason, explanationKey: `adjust.${reason}`, kind: "conception" };
}

/**
 * Ajustement hebdomadaire : compare la moyenne 7 jours d'aujourd'hui à celles de 7, 14 et 21 jours avant.
 * Rien sous 14 jours de données. Stagnation 2 semaines : rien. 3 semaines : −cap. Perte trop rapide : +cap.
 * Le plancher calorique l'emporte toujours.
 */
export function weeklyAdjust(i: AdjustInput): Adjustment {
  const { currentKcal: kcal, capKcal: cap, weights, today } = i;
  const first = weights.map((w) => w.date).sort()[0];
  const now = average7(weights, today);
  const w1 = average7(weights, addDays(today, -7));
  if (!first || first > addDays(today, -RULES.adjustMinDays.value) || now === null || w1 === null) {
    return result(kcal, kcal, "not-enough-data");
  }
  if ((w1 - now) / w1 > RULES.maxLossPctPerWeek.value) return result(kcal, kcal + cap, "too-fast");

  const w2 = average7(weights, addDays(today, -14));
  const w3 = average7(weights, addDays(today, -21));
  if (w3 !== null && now >= w3 && w2 !== null && now >= w2) {
    const floor = KCAL_FLOOR[i.sex];
    return kcal - cap < floor ? result(kcal, floor, "floor") : result(kcal, kcal - cap, "stalled-3w");
  }
  if (w2 !== null && now >= w2) return result(kcal, kcal, "stalled-2w");
  return result(kcal, kcal, "on-track");
}
