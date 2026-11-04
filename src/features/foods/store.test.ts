import "fake-indexeddb/auto";
import { beforeEach, expect, test } from "vitest";
import { db } from "@/lib/db";
import { findByBarcode, saveFood } from "./store";

const base = { source: "off" as const, name: "Skyr", per100g: { kcal: 60, protein: 11, carbs: 4, fat: 0.2 }, portions: [] };

beforeEach(async () => {
  await db.foods.clear();
});

test("un produit rescanné garde le même id", async () => {
  const a = await saveFood({ ...base, barcode: "3017620422003" });
  const b = await saveFood({ ...base, barcode: "3017620422003", name: "Skyr nature" });
  expect(b.id).toBe(a.id);
  expect((await findByBarcode("3017620422003"))?.name).toBe("Skyr nature");
  expect(await db.foods.count()).toBe(1);
});
