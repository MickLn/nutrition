import { db } from "@/lib/db";

/** Enregistre une pesée manuelle. */
export async function addWeight(date: string, kg: number) {
  await db.weights.add({ id: crypto.randomUUID(), date, kg, source: "manual", updatedAt: Date.now() });
}
