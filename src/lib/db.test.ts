import "fake-indexeddb/auto";
import Dexie from "dexie";
import { beforeEach, describe, expect, it } from "vitest";
import { buildBackup, importBackup, upgradeBackup } from "./backup";
import { db, NutritionDB } from "./db";

const snap = { kcal: 100, protein: 10, carbs: 10, fat: 2 };

describe("migration v1 → v2", () => {
  it("copie les favoris dans menus et donne une heure aux anciennes saisies", async () => {
    const old = new Dexie("migr-test");
    old.version(1).stores({ logEntries: "id, date", favorites: "id, name", recipes: "id, name, updatedAt" });
    await old.table("favorites").put({ id: "f1", name: "Petit-déj", items: [], updatedAt: 1 });
    await old.table("logEntries").put({ id: "e1", date: "2026-10-01", meal: "lunch", grams: 100, snapshot: snap });
    await old.table("recipes").put({ id: "r1", name: "Dal", ingredients: [], servings: 2, updatedAt: 1 });
    old.close();

    const v2 = new NutritionDB("migr-test");
    expect(await v2.menus.get("f1")).toMatchObject({ name: "Petit-déj" });
    expect(await v2.logEntries.get("e1")).toMatchObject({ time: "12:00", snapshot: { fiber: 0 } });
    expect(await v2.recipes.get("r1")).toMatchObject({ kind: "recipe" });
    v2.close();
  });
});

describe("sauvegarde JSON", () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });

  it("un export puis un import redonne les mêmes lignes", async () => {
    await db.logEntries.put({
      id: "e1", date: "2026-11-04", time: "08:10", meal: "breakfast", refType: "food", refId: "x",
      name: "Skyr", grams: 150, snapshot: { ...snap, fiber: 0 }, updatedAt: 1,
    });
    await db.waists.put({ id: "w1", date: "2026-11-04", cm: 84, updatedAt: 1 });
    await db.menus.put({ id: "m1", name: "Matin", items: [], updatedAt: 1 });
    const backup = await buildBackup({ includeImages: false });
    await Promise.all(db.tables.map((t) => t.clear()));
    await importBackup(backup, "replace");
    expect(await db.logEntries.toArray()).toEqual(backup.tables.logEntries);
    expect(await db.waists.count()).toBe(1);
    expect(await db.menus.count()).toBe(1);
  });

  it("une sauvegarde v1 passe en v2", () => {
    const up = upgradeBackup({
      app: "nutrition", schemaVersion: 1, exportedAt: "", images: [],
      tables: { favorites: [{ id: "f1", name: "A", items: [] }], logEntries: [{ id: "e1", snapshot: snap }] },
    }) as { schemaVersion: number; tables: Record<string, Record<string, unknown>[]> };
    expect(up.schemaVersion).toBe(2);
    expect(up.tables.menus[0]).toMatchObject({ id: "f1" });
    expect(up.tables.favorites).toBeUndefined();
    expect(up.tables.logEntries[0]).toMatchObject({ time: "12:00", snapshot: { fiber: 0 } });
  });
});
