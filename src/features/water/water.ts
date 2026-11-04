import { db } from "@/lib/db";

/** Ajoute une dose d'eau ; la fonction renvoyée l'enlève (« Annuler »). */
export async function addWater(date: string, ml: number): Promise<() => Promise<void>> {
  const id = crypto.randomUUID();
  await db.water.add({ id, date, ml, updatedAt: Date.now() });
  return () => db.water.delete(id);
}
