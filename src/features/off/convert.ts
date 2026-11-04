import { OFF } from "@/config/off";
import type { NewFood } from "@/features/foods/store";
import type { Macros } from "@/lib/db";

/** Fiche produit telle qu'Open Food Facts la renvoie (seulement les champs demandés). */
export type OffProduct = {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  serving_quantity_unit?: string;
  nutriments?: Record<string, number | string | undefined>;
  nutriscore_grade?: string;
  image_front_small_url?: string;
  image_front_url?: string;
  [field: string]: unknown;
};

/** Valeurs absentes de la fiche : enregistrées à 0, signalées à l'écran. */
export type MissingValue = "protein" | "carbs" | "fat";

export type Converted = { food: NewFood; missing: MissingValue[] };

const num = (v: unknown): number | null => {
  const x = typeof v === "string" ? parseFloat(v.replace(",", ".")) : typeof v === "number" ? v : NaN;
  return Number.isFinite(x) && x >= 0 ? x : null;
};
const round = (v: number, digits = 1) => Math.round(v * 10 ** digits) / 10 ** digits;
const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** kcal pour 100 g ; à défaut, conversion depuis les kJ (« energy_100g » est en kJ chez Open Food Facts). */
export function kcalPer100g(n: OffProduct["nutriments"] = {}): number | null {
  const kcal = num(n["energy-kcal_100g"]);
  if (kcal !== null) return round(kcal);
  const kj = num(n["energy-kj_100g"]) ?? num(n["energy_100g"]);
  return kj === null ? null : round(kj / OFF.kjPerKcal);
}

/**
 * Convertit une fiche Open Food Facts en aliment de l'app (valeurs pour 100 g).
 * Sans énergie, la fiche est inutilisable : renvoie null (l'écran « Produit inconnu » prend le relais).
 */
export function offToFood(p: OffProduct, code: string, lang: string): Converted | null {
  const n = p.nutriments ?? {};
  const kcal = kcalPer100g(n);
  if (kcal === null) return null;

  const missing: MissingValue[] = [];
  const macro = (key: string, name: MissingValue) => {
    const v = num(n[key]);
    if (v === null) missing.push(name);
    return round(v ?? 0, 2);
  };
  const optional = (key: string) => {
    const v = num(n[key]);
    return v === null ? null : round(v, 2);
  };
  const per100g: Macros = {
    kcal,
    protein: macro("proteins_100g", "protein"),
    carbs: macro("carbohydrates_100g", "carbs"),
    fat: macro("fat_100g", "fat"),
    fiber: optional("fiber_100g"),
    sugars: optional("sugars_100g"),
    salt: optional("salt_100g"),
  };

  const brand = text(p.brands).split(",")[0]?.trim() || undefined;
  const name = text(p[`product_name_${lang}`]) || text(p.product_name) || text(p.generic_name) || brand || code;
  const servingG = num(p.serving_quantity);
  const unit = text(p.serving_quantity_unit).toLowerCase();
  const portions = servingG && (!unit || unit === "g" || unit === "ml") ? [{ label: text(p.serving_size) || `${servingG} g`, grams: round(servingG) }] : [];
  const grade = text(p.nutriscore_grade).toLowerCase();

  const food: NewFood = {
    source: "off",
    name,
    barcode: code,
    per100g,
    portions,
    ...(brand && { brand }),
    ...(text(p.quantity) && { quantity: text(p.quantity) }),
    ...((OFF.nutriscoreGrades as readonly string[]).includes(grade) && { nutriscore: grade }),
    ...((text(p.image_front_small_url) || text(p.image_front_url)) && { imageUrl: text(p.image_front_small_url) || text(p.image_front_url) }),
  };
  return { food, missing };
}
