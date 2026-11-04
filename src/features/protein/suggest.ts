import { PROTEIN } from "@/config/protein";
import type { FoodItem } from "@/features/foods/types";

export type Suggestion = { food: FoodItem; grams: number; protein: number; kcal: number };

type Cfg = typeof PROTEIN;

/** Tard le soir ? (heure locale HH:MM) */
export const isLate = (hhmm: string, cfg: Cfg = PROTEIN) => hhmm >= cfg.lateFrom;

/** Quantité qui comble l'écart, limitée à la dernière quantité mangée (ou au plafond) et arrondie. */
export function portionFor(food: FoodItem, gap: number, cfg: Cfg = PROTEIN): Suggestion | null {
  const per100 = food.per100g.protein;
  if (!(per100 > 0) || gap <= 0) return null;
  const cap = Math.min(food.lastGrams ?? cfg.maxPortionG, cfg.maxPortionG);
  const grams = Math.max(cfg.roundG, Math.round(Math.min((gap / per100) * 100, cap) / cfg.roundG) * cfg.roundG);
  return { food, grams, protein: (per100 * grams) / 100, kcal: (food.per100g.kcal * grams) / 100 };
}

function rank(list: Suggestion[], late: boolean) {
  // Tard le soir : le plus de protéines pour le moins de calories. Sinon : celui qui comble le plus.
  return [...list].sort((a, b) => (late ? b.protein / (b.kcal || 1) - a.protein / (a.kcal || 1) : b.protein - a.protein));
}

/**
 * Suggestions pour combler `gap` g de protéines.
 * `own` = aliments habituels (récents et perso), `catalog` = catalogue CIQUAL, utilisé seulement pour compléter.
 */
export function suggestFoods(gap: number, own: FoodItem[], catalog: FoodItem[], late: boolean, cfg: Cfg = PROTEIN): Suggestion[] {
  const seen = new Set<string>();
  const build = (foods: FoodItem[], ok: (f: FoodItem) => boolean) => {
    const out: Suggestion[] = [];
    for (const f of foods) {
      const key = f.name.toLowerCase();
      if (seen.has(key) || !ok(f)) continue;
      const s = portionFor(f, gap, cfg);
      if (!s || (late && s.kcal > cfg.lightKcalMax)) continue;
      seen.add(key);
      out.push(s);
    }
    return rank(out, late);
  };
  const mine = build(own, (f) => f.per100g.protein >= cfg.minPer100g).slice(0, cfg.count);
  if (mine.length >= cfg.catalogFillBelow) return mine;
  const c = cfg.catalog;
  const filler = build(catalog, (f) => f.per100g.protein >= c.minPer100g && f.per100g.protein <= c.maxPer100g && f.per100g.kcal <= c.kcalMaxPer100g);
  return [...mine, ...filler].slice(0, cfg.count);
}
