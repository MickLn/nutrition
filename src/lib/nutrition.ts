import type { LogEntry, Macros } from "./db";

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** Valeurs d'une entrée du journal à partir de sa copie pour 100 g. */
export function entryMacros(e: Pick<LogEntry, "grams" | "snapshot">): Macros {
  const k = e.grams / 100;
  return { kcal: e.snapshot.kcal * k, protein: e.snapshot.protein * k, carbs: e.snapshot.carbs * k, fat: e.snapshot.fat * k };
}

export function sumMacros(entries: Pick<LogEntry, "grams" | "snapshot">[]): Macros {
  return entries.reduce<Macros>((acc, e) => {
    const m = entryMacros(e);
    return { kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat };
  }, ZERO);
}

export type Goals = Macros;

export const GOALS_KEY = "goals";
