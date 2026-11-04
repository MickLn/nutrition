import { resolveCooked, type Cooked } from "@/bricks/cooked/cooked";
import type { FoodItem } from "@/features/foods/types";
import type { CookedPairs } from "./pairs";

/** Ce que l'app sait d'un aliment pour le peser cuit. */
export type CookedContext = {
  pairs: CookedPairs;
  /** Aliments CIQUAL par id (« ciqual:9811 ») ; undefined tant que la table n'est pas chargée. */
  ciqual: (id: string) => FoodItem | undefined;
  /** « Ma pesée » faite sur ce produit (Food.cookedYield). */
  productYield?: number;
  /** « Ma pesée » faite sur les aliments de base, par id. */
  baseYields: Record<string, number>;
};

export type CookedInfo = {
  /** Afficher le choix « Pesé cru / Pesé cuit ». */
  available: boolean;
  /** Valeurs pour 100 g cuits et leur source, ou null (pas encore de conversion possible). */
  cooked: Cooked | null;
  /** Nom de la version cuite CIQUAL quand c'est elle qui sert. */
  cookedName?: string;
};

/** Choisit la source de la valeur cuite (ordre RULES.cookedSources, via resolveCooked). */
export function cookedInfo(base: FoodItem, ctx: CookedContext): CookedInfo {
  const pairId = ctx.pairs.cookedOf(base.id);
  const cookedItem = pairId ? ctx.ciqual(pairId) : undefined;
  const cooked = resolveCooked({
    rawPer100g: base.per100g,
    productYield: ctx.productYield,
    baseYield: ctx.baseYields[base.id],
    ciqualCookedPer100g: cookedItem?.per100g,
  });
  return {
    available: !!cooked || !!pairId || ctx.pairs.isWeighable(base.id),
    cooked,
    cookedName: cooked?.source === "ciqual-cooked" ? cookedItem?.name : undefined,
  };
}

/**
 * Aliment tel qu'il part dans la saisie quand on le pèse cuit : valeurs pour 100 g cuits,
 * donc la copie (snapshot) de l'entrée garde ce qui a vraiment été mangé.
 * Sans conversion possible, la quantité reste vide : rien n'est ajouté au repas.
 */
export function weighCooked(base: FoodItem, cooked: Cooked | null, grams: number | null, name: string): { food: FoodItem; grams: number | null } {
  if (!cooked) return { food: base, grams: null };
  return { food: { ...base, name, per100g: { ...base.per100g, ...cooked.per100g } }, grams };
}

/** Où « Ma pesée » est rangée : sur le produit (aliment perso, scanné) ou sur l'aliment de base CIQUAL. */
export const weighingTarget = (foodId: string): "product" | "base" => (foodId.startsWith("ciqual:") ? "base" : "product");
