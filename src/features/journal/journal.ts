import { addDays } from "@/lib/dates";
import { db, type LogEntry, type Meal } from "@/lib/db";
import type { FoodItem } from "@/features/foods/types";

const uid = () => crypto.randomUUID();
export const nowHHMM = (d = new Date()) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Ajoute plusieurs aliments d'un coup au même repas. Renvoie les entrées créées. `refType` « recipe » : un plat (menus). */
export async function addEntries(date: string, meal: Meal, items: { food: FoodItem; grams: number; refType?: LogEntry["refType"] }[], time = nowHHMM()) {
  const now = Date.now();
  const rows: LogEntry[] = items
    .filter((i) => i.grams > 0)
    .map(({ food, grams, refType = "food" }) => ({
      id: uid(),
      date,
      time,
      meal,
      refType,
      refId: food.id,
      name: food.name,
      grams,
      snapshot: { ...food.per100g },
      updatedAt: now,
    }));
  await db.logEntries.bulkAdd(rows);
  return rows;
}

export async function setGrams(id: string, grams: number) {
  await db.logEntries.update(id, { grams, updatedAt: Date.now() });
}

/** Retire une entrée ; la fonction renvoyée la remet (bouton « Annuler »). */
export async function removeEntry(id: string): Promise<() => Promise<void>> {
  const row = await db.logEntries.get(id);
  await db.logEntries.delete(id);
  return async () => {
    if (row) await db.logEntries.put(row);
  };
}

/** Copie le même repas de la veille. La fonction renvoyée annule la copie. */
export async function copyYesterday(date: string, meal: Meal): Promise<{ count: number; undo: () => Promise<void> }> {
  const src = await db.logEntries.where("[date+meal]").equals([addDays(date, -1), meal]).toArray();
  const now = Date.now();
  const rows = src.map((e) => ({ ...e, id: uid(), date, updatedAt: now }));
  await db.logEntries.bulkAdd(rows);
  return { count: rows.length, undo: () => db.logEntries.bulkDelete(rows.map((r) => r.id)) };
}

/** Quantités déjà saisies pour un aliment, de la plus ancienne à la plus récente. */
export async function pastGrams(refId: string): Promise<number[]> {
  const rows = await db.logEntries.where("refId").equals(refId).toArray();
  return rows.sort((a, b) => a.updatedAt - b.updatedAt).map((r) => r.grams);
}

/** Derniers aliments saisis, sans doublon, le plus récent d'abord. */
export async function recentFoods(limit: number): Promise<FoodItem[]> {
  const rows = await db.logEntries.orderBy("updatedAt").reverse().limit(limit * 5).toArray();
  const seen = new Set<string>();
  const out: FoodItem[] = [];
  for (const r of rows) {
    if (seen.has(r.refId)) continue;
    seen.add(r.refId);
    out.push({ id: r.refId, name: r.name, per100g: r.snapshot, portions: [], lastGrams: r.grams });
    if (out.length >= limit) break;
  }
  return out;
}

/** Y a-t-il un jour avec des données avant `date` ? (règle de la flèche ‹) */
export async function hasDataBefore(date: string): Promise<boolean> {
  return (await db.logEntries.where("date").below(date).count()) > 0;
}
