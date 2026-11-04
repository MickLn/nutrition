import { findByBarcode } from "@/features/foods/store";
import type { MissingValue } from "@/features/off/convert";
import { fetchOffProduct } from "@/features/off/fetch";
import type { Food } from "@/lib/db";
import type { NewFood } from "@/features/foods/store";

/** Ce que l'écran affiche après la lecture d'un code. */
export type Lookup =
  | { status: "known"; food: Food }
  | { status: "found"; food: NewFood; missing: MissingValue[] }
  | { status: "unknown" }
  | { status: "offline" }
  | { status: "error" };

/** Produit déjà enregistré sur le téléphone d'abord (marche hors ligne), sinon Open Food Facts. */
export async function lookupBarcode(code: string, lang: string): Promise<Lookup> {
  const known = await findByBarcode(code);
  if (known) return { status: "known", food: known };
  return fetchOffProduct(code, lang);
}
