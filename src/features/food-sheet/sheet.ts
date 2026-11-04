import { FOOD } from "@/config/food";
import type { FoodItem } from "@/features/foods/types";

/** Une puce de quantité sur la fiche : grammes seuls (« 60 g ») ou portion nommée (« 1 bol »). */
export type QuantityChip = { grams: number; label?: string };

/**
 * Puces de la fiche (Figma 7:315 : « 30 g, 60 g, 100 g, 1 bol ») : la quantité de la saisie ouverte, la portion
 * habituelle et 100 g, par ordre croissant, puis les portions nommées de l'aliment.
 */
export function quantityChips(opts: { entryGrams?: number | null; usual?: number | null; portions: FoodItem["portions"] }): QuantityChip[] {
  const plain = [...new Set([opts.entryGrams, opts.usual, FOOD.referenceGrams].filter((g): g is number => !!g && g > 0))].sort((a, b) => a - b);
  const named = opts.portions.filter((p) => p.grams > 0 && p.label.trim());
  return [...plain.map((grams) => ({ grams })), ...named.map((p) => ({ grams: p.grams, label: p.label }))];
}

/** Quantité choisie à l'ouverture : celle de la saisie, sinon la portion habituelle, sinon la première portion, sinon 100 g. */
export function initialGrams(opts: { entryGrams?: number | null; usual?: number | null; portions: FoodItem["portions"] }): number {
  return opts.entryGrams || opts.usual || opts.portions.find((p) => p.grams > 0)?.grams || FOOD.referenceGrams;
}

/** Lit un nombre de grammes positif dans l'URL (« ?g=60 »). */
export function gramsParam(v: string | null): number | null {
  const g = v === null ? NaN : Number(v);
  return Number.isFinite(g) && g > 0 ? g : null;
}
