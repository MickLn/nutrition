import { db, type Food } from "@/lib/db";

/**
 * Aliments enregistrés sur le téléphone (aliments perso et produits scannés).
 * Les autres briques passent par ces fonctions, jamais directement par la table.
 */
export type NewFood = Omit<Food, "id" | "updatedAt"> & { id?: string };

/** Enregistre ou met à jour un aliment ; un produit déjà connu par son code-barres garde le même id. */
export async function saveFood(f: NewFood): Promise<Food> {
  const existing = f.id ? await db.foods.get(f.id) : f.barcode ? await findByBarcode(f.barcode) : undefined;
  const food: Food = { ...existing, ...f, id: existing?.id ?? f.id ?? crypto.randomUUID(), updatedAt: Date.now() };
  await db.foods.put(food);
  return food;
}

export function getFood(id: string): Promise<Food | undefined> {
  return db.foods.get(id);
}

export function findByBarcode(barcode: string): Promise<Food | undefined> {
  return db.foods.where("barcode").equals(barcode).first();
}

export async function deleteFood(id: string): Promise<void> {
  await db.foods.delete(id);
}
