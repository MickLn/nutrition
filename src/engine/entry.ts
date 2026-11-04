import { RULES } from "@/config/rules";
import type { Meal } from "@/lib/db";

/** Créneau déduit de l'heure locale (HH:MM). Hors créneaux : collation. */
export function mealFromTime(hhmm: string): Meal {
  const slot = RULES.mealSlots.value.find((s) => hhmm >= s.from && hhmm <= s.to);
  return slot ? slot.meal : "snack";
}

/**
 * Raccourci de portion : la portion la plus fréquente sur les dernières saisies (plus récente en dernier).
 * Il apparaît dès qu'une portion revient 2 fois ; une saisie isolée ne le change pas.
 * Égalité : la plus récente gagne.
 */
export function portionShortcut(pastGrams: number[]): number | null {
  const recent = pastGrams.slice(-RULES.portionWindow.value);
  const count = new Map<number, number>();
  for (const g of recent) count.set(g, (count.get(g) ?? 0) + 1);
  let best: number | null = null;
  let bestN = 0;
  for (const g of recent) {
    const n = count.get(g)!;
    if (n >= bestN) [best, bestN] = [g, n];
  }
  return bestN >= RULES.portionMinRepeats.value ? best : null;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** « check » seulement avec assez d'historique et un écart de plus de ×4 ou ÷4 avec la médiane. */
export function quantityCheck(grams: number, pastGrams: number[]): "ok" | "check" {
  if (pastGrams.length < RULES.quantityMinHistory.value || grams <= 0) return "ok";
  const ratio = grams / median(pastGrams);
  const r = RULES.quantityRatio.value;
  return ratio > r || ratio < 1 / r ? "check" : "ok";
}
