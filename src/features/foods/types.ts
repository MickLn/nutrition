import type { Macros } from "@/lib/db";

/** Un aliment tel que la saisie le voit, quelle que soit sa source (CIQUAL, aliment perso, produit scanné). */
export type FoodItem = {
  /** « ciqual:9104 », ou l'id de la table foods pour un aliment perso. */
  id: string;
  name: string;
  per100g: Macros & { fiber: number };
  portions: { label: string; grams: number }[];
  /** Quantité de la dernière saisie (aliments récents). */
  lastGrams?: number;
};
