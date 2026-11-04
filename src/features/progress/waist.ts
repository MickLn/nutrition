import { db } from "@/lib/db";

/** Enregistre une mesure du tour de taille. */
export async function addWaist(date: string, cm: number) {
  await db.waists.add({ id: crypto.randomUUID(), date, cm, updatedAt: Date.now() });
}
