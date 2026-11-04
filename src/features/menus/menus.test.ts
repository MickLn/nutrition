import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { FoodItem } from "@/features/foods/types";
import { db, type Menu } from "@/lib/db";
import { sumMacros } from "@/lib/nutrition";
import {
  addMenuToMeal,
  deleteMenu,
  itemsTotal,
  mergeItems,
  partsOf,
  recipeNutrition,
  resolveItems,
  saveMenu,
  sortMenus,
  step,
  toEntries,
  viewMenu,
  type Lookup,
} from "./menus";

const pasta: FoodItem = { id: "ciqual:9811", name: "Pâtes protéinées", per100g: { kcal: 350, protein: 20, carbs: 55, fat: 3, fiber: 6 }, portions: [] };
const chicken: FoodItem = { id: "ciqual:36018", name: "Filet de poulet", per100g: { kcal: 120, protein: 24, carbs: 0, fat: 2, fiber: 0 }, portions: [] };
const oats: FoodItem = { id: "ciqual:9310", name: "Flocons d'avoine", per100g: { kcal: 370, protein: 13, carbs: 60, fat: 7, fiber: 10 }, portions: [] };
const FOODS = new Map([pasta, chicken, oats].map((f) => [f.id, f]));
const lookup: Lookup = async (id) => FOODS.get(id) ?? null;

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("valeurs d'un menu", () => {
  it("additionne les aliments pesés", () => {
    const t = itemsTotal([
      { per100g: pasta.per100g, grams: 100 },
      { per100g: chicken.per100g, grams: 150 },
    ]);
    expect(t.kcal).toBe(530);
    expect(t.protein).toBe(56);
  });

  it("calcule un plat pour 100 g à partir du poids cuit, et la part", () => {
    const per100 = new Map([[oats.id, oats.per100g]]);
    const r = recipeNutrition({ ingredients: [{ foodId: oats.id, grams: 200 }], cookedWeightG: 400, servings: 4 }, per100)!;
    expect(r.per100g.kcal).toBeCloseTo(185);
    expect(r.portionG).toBe(100);
    expect(partsOf(200, r.portionG)).toBe(2);
  });

  it("sans poids cuit, prend le poids cru total ; sans poids, renvoie null", () => {
    const per100 = new Map([[oats.id, oats.per100g]]);
    expect(recipeNutrition({ ingredients: [{ foodId: oats.id, grams: 50 }], servings: 1 }, per100)!.per100g.kcal).toBeCloseTo(370);
    expect(recipeNutrition({ ingredients: [], servings: 1 }, per100)).toBeNull();
  });

  it("le pas ne descend jamais sous 0", () => {
    expect(step(100, 10)).toBe(110);
    expect(step(5, -10)).toBe(0);
  });
});

describe("retrouver les éléments", () => {
  it("retrouve aliments et plats, laisse de côté ce qui manque", async () => {
    await db.recipes.put({ id: "r1", name: "Porridge", kind: "recipe", ingredients: [{ foodId: oats.id, grams: 100 }], cookedWeightG: 300, servings: 2, updatedAt: 1 });
    const items = await resolveItems(
      [
        { refType: "food", refId: pasta.id, grams: 100 },
        { refType: "recipe", refId: "r1", grams: 150 },
        { refType: "food", refId: "inconnu", grams: 50 },
        { refType: "recipe", refId: "absent", grams: 50 },
      ],
      lookup,
    );
    expect(items.map((i) => i.name)).toEqual(["Pâtes protéinées", "Porridge"]);
    expect(items[1].portionG).toBe(150);
    expect(Math.round(itemsTotal(items).kcal)).toBe(350 + 185);
  });

  it("une erreur de chargement n'empêche pas d'afficher le reste", async () => {
    const failing: Lookup = async (id) => {
      if (id === chicken.id) throw new Error("ciqual-missing");
      return FOODS.get(id) ?? null;
    };
    const v = await viewMenu({ id: "m", name: "M", items: [{ refType: "food", refId: pasta.id, grams: 100 }, { refType: "food", refId: chicken.id, grams: 100 }], updatedAt: 1 }, failing);
    expect(v.items).toHaveLength(1);
    expect(v.total.kcal).toBe(350);
  });
});

describe("tri et recherche", () => {
  const menus: Pick<Menu, "name" | "updatedAt" | "usedAt" | "favorite">[] = [
    { name: "Wrap thon", updatedAt: 1, usedAt: 50 },
    { name: "Pâtes poulet brocolis", updatedAt: 10, favorite: true },
    { name: "Omelette épinards", updatedAt: 30 },
  ];
  it("récents : dernier ajout, sinon dernière modification", () => {
    expect(sortMenus(menus, "recent").map((m) => m.name)).toEqual(["Wrap thon", "Omelette épinards", "Pâtes poulet brocolis"]);
  });
  it("A à Z, favoris, recherche sans accents", () => {
    expect(sortMenus(menus, "az", "", "fr").map((m) => m.name)).toEqual(["Omelette épinards", "Pâtes poulet brocolis", "Wrap thon"]);
    expect(sortMenus(menus, "fav").map((m) => m.name)).toEqual(["Pâtes poulet brocolis"]);
    expect(sortMenus(menus, "recent", "pates").map((m) => m.name)).toEqual(["Pâtes poulet brocolis"]);
  });
});

describe("enregistrer et ajouter", () => {
  it("enregistre, modifie, supprime puis annule", async () => {
    const m = await saveMenu({ name: "  Midi  ", items: [{ refType: "food", refId: pasta.id, grams: 100 }, { refType: "food", refId: chicken.id, grams: 0 }] });
    expect(m.name).toBe("Midi");
    expect(m.items).toHaveLength(1);
    const edited = await saveMenu({ id: m.id, name: "Midi", items: m.items, favorite: true });
    expect(edited.id).toBe(m.id);
    expect(await db.menus.count()).toBe(1);
    expect((await db.menus.get(m.id))?.favorite).toBe(true);
    const undo = await deleteMenu(m.id);
    expect(await db.menus.count()).toBe(0);
    await undo();
    expect(await db.menus.get(m.id)).toMatchObject({ name: "Midi" });
  });

  it("ajoute un menu au repas avec des copies figées, et Annuler retire tout", async () => {
    await db.recipes.put({ id: "r1", name: "Porridge", kind: "batch", ingredients: [{ foodId: oats.id, grams: 100 }], cookedWeightG: 300, servings: 2, updatedAt: 1 });
    const menu = await saveMenu({ name: "Matin", items: [{ refType: "food", refId: chicken.id, grams: 150 }, { refType: "recipe", refId: "r1", grams: 150 }] });
    const v = await viewMenu(menu, lookup);
    // Quantité corrigée pour cette fois : le menu ne change pas.
    const today = v.items.map((i) => (i.refId === chicken.id ? { ...i, grams: 200 } : i));
    const { count, undo } = await addMenuToMeal(menu.id, today, "2026-11-04", "breakfast", "08:00");
    expect(count).toBe(2);
    const rows = await db.logEntries.toArray();
    expect(rows.map((r) => [r.refType, r.refId, r.grams, r.meal, r.time])).toEqual(
      expect.arrayContaining([
        ["food", chicken.id, 200, "breakfast", "08:00"],
        ["recipe", "r1", 150, "breakfast", "08:00"],
      ]),
    );
    expect(Math.round(sumMacros(rows).kcal)).toBe(240 + 185);
    expect((await db.menus.get(menu.id))?.items[0].grams).toBe(150);
    expect((await db.menus.get(menu.id))?.usedAt).toBeGreaterThan(0);

    // Modifier ensuite l'aliment ne réécrit pas l'entrée (copie figée).
    expect(rows.find((r) => r.refId === chicken.id)?.snapshot.kcal).toBe(120);

    await undo();
    expect(await db.logEntries.count()).toBe(0);
    expect((await db.menus.get(menu.id))?.usedAt).toBeUndefined();
  });

  it("toEntries garde le type de chaque élément", () => {
    const e = toEntries([{ refType: "recipe", refId: "r1", grams: 100, name: "Plat", per100g: oats.per100g, portionG: 100 }]);
    expect(e[0]).toMatchObject({ refType: "recipe", grams: 100, food: { id: "r1", name: "Plat" } });
  });
});

describe("ajouter des éléments", () => {
  it("sans doublon ni élément vide, l'élément déjà présent garde sa quantité", () => {
    const out = mergeItems(
      [{ refType: "food", refId: "a", grams: 100 }],
      [
        { refType: "food", refId: "a", grams: 50 },
        { refType: "recipe", refId: "a", grams: 200 },
        { refType: "food", refId: "b", grams: 0 },
        { refType: "food", refId: "c", grams: 30 },
        { refType: "food", refId: "c", grams: 40 },
      ],
    );
    expect(out).toEqual([
      { refType: "food", refId: "a", grams: 100 },
      { refType: "recipe", refId: "a", grams: 200 },
      { refType: "food", refId: "c", grams: 30 },
    ]);
  });
});
