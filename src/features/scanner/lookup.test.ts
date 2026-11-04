import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { saveFood } from "@/features/foods/store";
import { db } from "@/lib/db";
import { lookupBarcode } from "./lookup";

beforeEach(() => db.foods.clear());
afterEach(() => vi.unstubAllGlobals());

test("produit déjà enregistré : trouvé sans appeler Open Food Facts (marche hors ligne)", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await saveFood({ source: "off", name: "Skyr", barcode: "3017620422003", per100g: { kcal: 60, protein: 11, carbs: 4, fat: 0.2 }, portions: [] });
  const r = await lookupBarcode("3017620422003", "fr");
  expect(r.status).toBe("known");
  expect(fetch).not.toHaveBeenCalled();
});

test("produit inconnu du téléphone : demande à Open Food Facts", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  expect(await lookupBarcode("3017620422003", "fr")).toEqual({ status: "offline" });
});
