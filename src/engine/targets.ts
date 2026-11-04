import { RULES } from "@/config/rules";
import type { Profile, Sex } from "@/config/profile";

export type Targets = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  waterL: number;
  /** true si le plancher calorique a remplacé le calcul. */
  floorApplied: boolean;
  /** Déficit quotidien visé, en kcal. */
  deficit: number;
};

export const KCAL_FLOOR: Record<Sex, number> = RULES.kcalFloor.value;

/** Métabolisme de base, formule Mifflin-St Jeor. */
export function bmr(p: Profile, weightKg: number): number {
  return 10 * weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "m" ? 5 : -161);
}

/** Dépense totale = métabolisme de base × niveau d'activité. */
export function tdee(p: Profile, weightKg: number): number {
  return bmr(p, weightKg) * p.activity;
}

/** Déficit quotidien : 0,7 %/semaine, plafonné à 1 %/semaine et 0,9 kg/semaine. */
export function dailyDeficit(avgWeightKg: number): number {
  const pct = Math.min(RULES.lossPctPerWeek.value, RULES.maxLossPctPerWeek.value);
  const kgPerWeek = Math.min(pct * avgWeightKg, RULES.maxLossKgPerWeek.value);
  return (kgPerWeek * RULES.kcalPerKg.value) / 7;
}

/** Protéines et lipides selon le profil ; glucides = le reste, jamais négatifs. */
export function macrosFor(kcal: number, p: Profile, avgWeightKg: number): Pick<Targets, "protein" | "fat" | "carbs"> {
  const g = RULES.kcalPerG.value;
  const protein = p.proteinGPerKg * avgWeightKg;
  const fat = Math.max((p.fatPct * kcal) / g.fat, RULES.fatFloorGPerKg.value * avgWeightKg);
  const carbs = Math.max(0, (kcal - protein * g.protein - fat * g.fat) / g.carbs);
  return { protein, fat, carbs };
}

/** Cible de départ en sèche, à partir de la moyenne de poids 7 jours. */
export function startTargets(p: Profile, avgWeightKg: number): Targets {
  const deficit = dailyDeficit(avgWeightKg);
  const raw = tdee(p, avgWeightKg) - deficit;
  const floor = KCAL_FLOOR[p.sex];
  const kcal = Math.max(raw, floor);
  return { kcal, ...macrosFor(kcal, p, avgWeightKg), fiber: p.fiberG, waterL: p.waterL, floorApplied: raw < floor, deficit };
}

/** « − perte » affichée : écart arrondi entre la dépense et l'objectif (plancher compris), pour que le calcul affiché tombe juste. */
export function shownLoss(p: Profile, weightKg: number, kcal: number): number {
  return Math.round(tdee(p, weightKg)) - Math.round(kcal);
}
