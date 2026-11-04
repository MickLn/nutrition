import type { Macros } from "@/lib/db";

const KEYS = ["kcal", "protein", "carbs", "fat", "fiber"] as const;
export type CoreMacros = Pick<Macros, (typeof KEYS)[number]> & { fiber: number };

export const scale = (m: CoreMacros, k: number): CoreMacros =>
  Object.fromEntries(KEYS.map((key) => [key, (m[key] ?? 0) * k])) as CoreMacros;

const add = (a: CoreMacros, b: CoreMacros): CoreMacros =>
  Object.fromEntries(KEYS.map((key) => [key, (a[key] ?? 0) + (b[key] ?? 0)])) as CoreMacros;

export const ZERO: CoreMacros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

/** Total du plat à partir des ingrédients pesés crus. */
export function batchTotals(ingredients: { per100g: CoreMacros; grams: number }[]): CoreMacros {
  return ingredients.reduce((acc, i) => add(acc, scale(i.per100g, i.grams / 100)), ZERO);
}

/** Part = portion ÷ poids cuit total. Erreur explicite si le poids cuit manque. */
export function portionMacros(total: CoreMacros, cookedWeightG: number, portionG: number): CoreMacros {
  if (!(cookedWeightG > 0)) throw new Error("batch.cooked-weight-missing");
  return scale(total, portionG / cookedWeightG);
}

/** Ce qui reste du plat, jamais moins de 0 (fermeture à 0 g). */
export function remainingAfter(cookedWeightG: number, eatenG: number[]): number {
  return Math.max(0, cookedWeightG - eatenG.reduce((a, b) => a + b, 0));
}
