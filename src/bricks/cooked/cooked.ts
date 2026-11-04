import { RULES } from "@/config/rules";
import { scale, type CoreMacros } from "@/bricks/batch/math";

/**
 * Passer d'un aliment pesé cuit à ses valeurs.
 * Rendement = poids cuit ÷ poids cru (pâtes ≈ ×2,20). Valeurs pour 100 g cuits = valeurs crues ÷ rendement.
 * Ordre des sources réglé dans RULES.cookedSources (décision du 02/11) :
 * pesée du produit, pesée de l'aliment de base, valeur cuite CIQUAL, sinon aucune conversion.
 */
export type CookedSource = (typeof RULES.cookedSources.value)[number];

export type CookedInput = {
  rawPer100g: CoreMacros;
  /** Rendement mesuré par l'utilisateur sur ce produit précis. */
  productYield?: number;
  /** Rendement mesuré sur l'aliment de base (ex. « Pâtes »), partagé par les produits rattachés. */
  baseYield?: number;
  /** Valeurs CIQUAL de la version cuite, seulement si la paire cru / cuit est validée. */
  ciqualCookedPer100g?: CoreMacros;
};

export type Cooked = { per100g: CoreMacros; source: CookedSource; yield?: number };

/** Rendement mesuré à partir d'une pesée crue puis cuite. */
export function yieldFrom(rawG: number, cookedG: number): number {
  if (!(rawG > 0) || !(cookedG > 0)) throw new Error("cooked.weighing-invalid");
  return cookedG / rawG;
}

/** Valeurs pour 100 g cuits selon la première source disponible, ou null (pas de conversion). */
export function resolveCooked(i: CookedInput): Cooked | null {
  for (const source of RULES.cookedSources.value) {
    const y = source === "product-weighing" ? i.productYield : source === "base-weighing" ? i.baseYield : undefined;
    if (y !== undefined && y > 0) return { per100g: scale(i.rawPer100g, 1 / y), source, yield: y };
    if (source === "ciqual-cooked" && i.ciqualCookedPer100g) return { per100g: i.ciqualCookedPer100g, source };
  }
  return null;
}

/** Valeurs d'une portion cuite pesée. */
export function cookedMacros(cookedPer100g: CoreMacros, cookedG: number): CoreMacros {
  return scale(cookedPer100g, cookedG / 100);
}
