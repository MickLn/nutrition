import { db, type Weight } from "@/lib/db";

/** Enregistre une pesée (à la main par défaut, ou importée d'Apple Santé). */
export async function addWeight(date: string, kg: number, source: Weight["source"] = "manual") {
  await db.weights.add({ id: crypto.randomUUID(), date, kg, source, updatedAt: Date.now() });
}
