import { FOOD } from "@/config/food";
import { normalize } from "@/features/foods/catalog";
import type { FoodItem } from "@/features/foods/types";

export type VaryRules = { -readonly [K in keyof typeof FOOD.vary]: K extends "excludedGroups" ? readonly string[] : number };

const MACROS = ["protein", "carbs", "fat", "fiber"] as const;

/** Mots du début du nom (avant la première virgule) : « Oat flakes, raw » → oat, flakes. */
function headWords(name: string, minLength: number): Set<string> {
  const head = normalize(name).split(",")[0];
  return new Set(head.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= minLength));
}

/** Distance entre deux aliments, en g pour 100 g, sur protéines, glucides, lipides et fibres. */
export function macroDistance(a: FoodItem["per100g"], b: FoodItem["per100g"]): number {
  return Math.sqrt(MACROS.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0));
}

/** Groupe CIQUAL d'un id « ciqual:11006 » (2 premiers chiffres d'un code à 5 chiffres), sinon null. */
function ciqualGroup(id: string): string | null {
  const code = id.startsWith("ciqual:") ? id.slice(7) : "";
  return code.length === 5 ? code.slice(0, 2) : null;
}

/**
 * « Pour varier, macros proches » : aliments aux macros et calories proches, plus riches en protéines
 * ou moins caloriques. Les variantes du même aliment (« …, bio ») et les aides culinaires sont écartées.
 * Les plus proches d'abord ; un mot commun dans le début du nom compte comme une même famille.
 */
export function similarFoods(base: FoodItem, catalog: FoodItem[], rules: VaryRules = FOOD.vary): FoodItem[] {
  const b = base.per100g;
  if (b.kcal <= 0) return [];
  const baseName = normalize(base.name);
  const baseWords = headWords(base.name, rules.minWordLength);
  const scored: { item: FoodItem; score: number }[] = [];
  for (const item of catalog) {
    const v = item.per100g;
    if (item.id === base.id || v.kcal <= 0) continue;
    const group = ciqualGroup(item.id);
    if (group && rules.excludedGroups.includes(group)) continue;
    const name = normalize(item.name);
    if (name.startsWith(baseName) || baseName.startsWith(name)) continue;
    if (Math.abs(v.kcal - b.kcal) > rules.maxKcalRatio * b.kcal) continue;
    const better = v.protein >= b.protein + rules.minProteinGainG || v.kcal <= b.kcal - rules.minKcalSave;
    if (!better) continue;
    const distance = macroDistance(v, b);
    if (distance > rules.maxDistanceG) continue;
    const words = headWords(item.name, rules.minWordLength);
    const sameFamily = [...words].some((w) => baseWords.has(w));
    scored.push({ item, score: distance - (sameFamily ? rules.sameWordBonusG : 0) });
  }
  return scored
    .sort((x, y) => x.score - y.score)
    .slice(0, rules.count)
    .map((s) => s.item);
}
