import { batchTotals, portionMacros, remainingAfter, ZERO, type CoreMacros } from "@/bricks/batch/math";
import { DISHES } from "@/config/dishes";
import { normalize } from "@/features/foods/catalog";
import type { FoodItem } from "@/features/foods/types";
import type { Recipe } from "@/lib/db";

/**
 * Logique pure des plats (recettes et plats en lot). Les calculs de part viennent de la brique « batch »
 * (src/bricks/batch/math.ts) : part = poids de la part ÷ poids total cuit, macros = part × total du plat.
 */
export type Ingredient = Recipe["ingredients"][number];

/** Total du plat entier, d'après les ingrédients pesés crus. */
export function dishTotals(r: Pick<Recipe, "ingredients">): CoreMacros {
  return batchTotals(r.ingredients.map((i) => ({ per100g: i.per100g ?? ZERO, grams: i.grams })));
}

export const rawWeight = (r: Pick<Recipe, "ingredients">) => r.ingredients.reduce((a, i) => a + i.grams, 0);

/** Poids de référence d'une part : le poids cuit s'il a été pesé, sinon la somme des ingrédients crus. */
export function refWeight(r: Pick<Recipe, "ingredients" | "cookedWeightG">): number {
  return r.cookedWeightG && r.cookedWeightG > 0 ? r.cookedWeightG : rawWeight(r);
}

/** Valeurs d'une part de `grams` (pesée cuite). Plat sans poids : zéro. */
export function partMacros(r: Pick<Recipe, "ingredients" | "cookedWeightG">, grams: number): CoreMacros {
  const ref = refWeight(r);
  return ref > 0 ? portionMacros(dishTotals(r), ref, grams) : ZERO;
}

/** Le plat vu comme un aliment (valeurs pour 100 g cuits), pour l'ajouter au journal. */
export function dishItem(r: Recipe): FoodItem {
  return { id: r.id, name: r.name, per100g: partMacros(r, 100), portions: [] };
}

/** Ce qui reste d'un plat en lot, en g ; null pour un plat classique. */
export function remainingOf(r: Recipe): number | null {
  if (r.kind !== "batch") return null;
  if (r.finishedAt) return 0;
  return r.remainingG ?? r.cookedWeightG ?? 0;
}

/** Plat en lot en cours : pas terminé et pas vide (bloc « À finir », écran de saisie). */
export const inProgress = (r: Recipe) => r.kind === "batch" && !r.finishedAt && (remainingOf(r) ?? 0) > 0;

/** Après une part mangée : le reste baisse, et le plat se ferme à 0 g sans question. */
export function afterPart(r: Recipe, grams: number, now = Date.now()): Partial<Recipe> {
  if (r.kind !== "batch") return { updatedAt: now };
  const left = remainingAfter(remainingOf(r) ?? 0, [grams]);
  return { remainingG: left, finishedAt: left === 0 ? now : undefined, updatedAt: now };
}

/**
 * « Il reste X g » : le reste est corrigé sans question et l'écart n'est compté nulle part.
 * (Question ouverte, etat-projet.md : l'écart est-il du mangé non noté ou du jeté ? Tant qu'elle n'est pas tranchée, on ne compte rien.)
 */
export function declareRemaining(r: Recipe, grams: number, now = Date.now()): Partial<Recipe> {
  const max = r.cookedWeightG ?? grams;
  const left = Math.min(Math.max(grams, 0), max);
  return { remainingG: left, finishedAt: left === 0 ? now : undefined, updatedAt: now };
}

/** « Jeter le reste » : le plat est terminé, rien n'est compté. */
export const discardRest = (now = Date.now()): Partial<Recipe> => ({ remainingG: 0, finishedAt: now, updatedAt: now });

/** Part habituelle : moyenne des parts déjà mangées, sinon la part par défaut. */
export function typicalPart(eaten: number[]): number {
  const xs = eaten.filter((g) => g > 0);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : DISHES.defaultPartG;
}

/** « environ 3 parts » : clé de texte et nombre, ou null quand il ne reste rien. */
export function partsLeft(remainingG: number, partG: number): { key: "parts-less" | "parts-one" | "parts-many"; n: number } | null {
  if (!(remainingG > 0) || !(partG > 0)) return null;
  const n = Math.round(remainingG / partG);
  return { key: n === 0 ? "parts-less" : n === 1 ? "parts-one" : "parts-many", n };
}

/** Jour d'un événement : le nom du jour s'il est récent (« dimanche »), sinon la date (« 28 oct. »). */
export function whenLabel(d: Date, today: Date, locale: string, within: number = DISHES.weekdayWithinDays): { kind: "weekday" | "date"; text: string } {
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(today) - day(d)) / 86_400_000);
  if (days >= 0 && days <= within) return { kind: "weekday", text: new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d) };
  return { kind: "date", text: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d) };
}

export type DishDraft = { name: string; ingredients: Ingredient[]; batch: boolean; cookedG: number | null };
export type DraftError = "name" | "ingredients" | "cooked";

/** Ce qui manque pour enregistrer le plat (vide = prêt). */
export function draftErrors(d: DishDraft): DraftError[] {
  const errors: DraftError[] = [];
  if (!d.name.trim()) errors.push("name");
  if (!d.ingredients.some((i) => i.grams > 0)) errors.push("ingredients");
  if (d.batch && !(d.cookedG && d.cookedG > 0)) errors.push("cooked");
  return errors;
}

/**
 * Brouillon → plat enregistré. Un nouveau plat en lot démarre avec tout son poids cuit ;
 * modifié en cours, son reste suit l'écart de poids cuit (jamais sous 0 ni au-dessus du poids cuit).
 */
export function draftToRecipe(d: DishDraft, id: string, previous?: Recipe, now = Date.now()): Recipe {
  const ingredients = d.ingredients.filter((i) => i.grams > 0);
  const cooked = d.cookedG && d.cookedG > 0 ? d.cookedG : undefined;
  const base = { id, name: d.name.trim(), ingredients, cookedWeightG: cooked, favorite: previous?.favorite, updatedAt: now };
  if (!d.batch || !cooked) return { ...base, kind: "recipe", servings: previous?.servings ?? 1, cookedAt: previous?.cookedAt };
  const servings = Math.max(1, Math.round(cooked / DISHES.defaultPartG));
  if (previous?.kind === "batch" && previous.cookedWeightG) {
    if (previous.finishedAt) return { ...base, kind: "batch", servings, remainingG: 0, finishedAt: previous.finishedAt, cookedAt: previous.cookedAt };
    const left = (remainingOf(previous) ?? 0) + (cooked - previous.cookedWeightG);
    return { ...base, kind: "batch", servings, remainingG: Math.min(Math.max(left, 0), cooked), cookedAt: previous.cookedAt ?? now };
  }
  return { ...base, kind: "batch", servings, remainingG: cooked, cookedAt: now };
}

/** Le plat a-t-il exactement ces aliments ? (pour ne pas reproposer un plat déjà enregistré) */
export function sameFoods(r: Pick<Recipe, "ingredients">, foodIds: string[]): boolean {
  const a = new Set(r.ingredients.map((i) => i.foodId));
  const b = new Set(foodIds);
  return a.size === b.size && [...a].every((x) => b.has(x));
}

export type DishSort = "recent" | "az" | "fav";

/**
 * Liste de l'onglet Plats : filtrée par la recherche (tous les mots, sans accents ni majuscules).
 * « Récents » : dernier changement d'abord (une part mangée compte) ; « A à Z » et « Favoris » : ordre alphabétique.
 */
export function filterDishes(list: Recipe[], query = "", sort: DishSort = "recent", locale = "fr"): Recipe[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const out = list.filter((r) => words.every((w) => normalize(r.name).includes(w)) && (sort !== "fav" || r.favorite));
  if (sort === "recent") return out.sort((a, b) => b.updatedAt - a.updatedAt);
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return out.sort((a, b) => collator.compare(a.name, b.name));
}
