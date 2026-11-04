import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { sumMacros } from "@/lib/nutrition";
import type { FoodItem } from "@/features/foods/types";
import { addEntries, copyYesterday, hasDataBefore, pastGrams, recentFoods, removeEntry, setGrams } from "./journal";

const rice: FoodItem = { id: "ciqual:9104", name: "Riz blanc, cuit", per100g: { kcal: 155, protein: 3.15, carbs: 33.2, fat: 0.7, fiber: 1.4 }, portions: [] };
const skyr: FoodItem = { id: "ciqual:19590", name: "Skyr", per100g: { kcal: 63, protein: 11, carbs: 4, fat: 0.2, fiber: 0 }, portions: [] };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("journal", () => {
  it("ajoute plusieurs aliments d'un coup et ignore les quantités vides", async () => {
    await addEntries("2026-11-04", "lunch", [{ food: rice, grams: 180 }, { food: skyr, grams: 0 }], "12:30");
    const rows = await db.logEntries.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ time: "12:30", meal: "lunch", grams: 180 });
    expect(Math.round(sumMacros(rows).kcal)).toBe(279);
  });

  it("retirer puis annuler remet l'entrée", async () => {
    const [e] = await addEntries("2026-11-04", "lunch", [{ food: rice, grams: 180 }]);
    const undo = await removeEntry(e.id);
    expect(await db.logEntries.count()).toBe(0);
    await undo();
    expect(await db.logEntries.get(e.id)).toMatchObject({ grams: 180 });
  });

  it("copier hier duplique le repas de la veille, annulable", async () => {
    await addEntries("2026-11-03", "breakfast", [{ food: skyr, grams: 150 }, { food: rice, grams: 50 }]);
    const { count, undo } = await copyYesterday("2026-11-04", "breakfast");
    expect(count).toBe(2);
    expect(await db.logEntries.where("date").equals("2026-11-04").count()).toBe(2);
    await undo();
    expect(await db.logEntries.where("date").equals("2026-11-04").count()).toBe(0);
  });

  it("historique des quantités, récents sans doublon, flèche ‹", async () => {
    const [a] = await addEntries("2026-11-03", "lunch", [{ food: rice, grams: 180 }]);
    await addEntries("2026-11-04", "lunch", [{ food: skyr, grams: 150 }]);
    await addEntries("2026-11-04", "dinner", [{ food: rice, grams: 200 }]);
    await setGrams(a.id, 190);
    expect((await pastGrams(rice.id)).sort()).toEqual([190, 200]);
    expect((await recentFoods(10)).map((f) => f.id).sort()).toEqual([rice.id, skyr.id].sort());
    expect(await hasDataBefore("2026-11-04")).toBe(true);
    expect(await hasDataBefore("2026-11-03")).toBe(false);
  });
});
