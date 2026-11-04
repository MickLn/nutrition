import { addWeight } from "@/features/body/weight";
import { db } from "@/lib/db";
import { uniqueWeights, type HealthWeight } from "./parse";

/** Enregistre les pesées ; ignore celles qui existent déjà (même date et même poids). */
export async function importHealthWeights(items: HealthWeight[]): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;
  for (const it of uniqueWeights(items)) {
    const same = await db.weights
      .where("date")
      .equals(it.date)
      .filter((w) => w.kg === it.kg)
      .count();
    if (same > 0) skipped++;
    else {
      await addWeight(it.date, it.kg, "health");
      added++;
    }
  }
  return { added, skipped };
}
