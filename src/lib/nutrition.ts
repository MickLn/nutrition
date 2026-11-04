import type { LogEntry, Macros } from "./db";

export type Core = { kcal: number; protein: number; carbs: number; fat: number; fiber: number };

export const ZERO: Core = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

/** Valeurs pour une quantité, à partir des valeurs pour 100 g. */
export function forGrams(per100g: Macros, grams: number): Core {
  const k = grams / 100;
  return {
    kcal: per100g.kcal * k,
    protein: per100g.protein * k,
    carbs: per100g.carbs * k,
    fat: per100g.fat * k,
    fiber: (per100g.fiber ?? 0) * k,
  };
}

/** Valeurs d'une entrée du journal à partir de sa copie pour 100 g. */
export function entryMacros(e: Pick<LogEntry, "grams" | "snapshot">): Core {
  return forGrams(e.snapshot, e.grams);
}

export function addCore(a: Core, b: Core): Core {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fiber: a.fiber + b.fiber };
}

export function sumMacros(entries: Pick<LogEntry, "grams" | "snapshot">[]): Core {
  return entries.map(entryMacros).reduce(addCore, ZERO);
}
