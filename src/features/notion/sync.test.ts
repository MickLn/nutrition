import { describe, expect, test } from "vitest";
import { applyDone, chunk, diffLibrary, fingerprint, isLate, keyOf, type LibraryItem } from "./sync";
import type { FoodData } from "./schema";

const food = (over: Partial<FoodData> = {}): FoodData => ({ name: "Skyr", source: "custom", kcal: 60, protein: 10, carbs: 4, fat: 0.2, fiber: 0, updatedAt: 1, ...over });
const item = (id: string, over?: Partial<FoodData>): LibraryItem => ({ kind: "food", id, data: food(over) });

describe("empreinte", () => {
  test("stable quel que soit l'ordre des champs", () => {
    const a = { name: "x", source: "off", kcal: 1, protein: 2, carbs: 3, fat: 4, updatedAt: 1 } as FoodData;
    const b = { updatedAt: 1, fat: 4, carbs: 3, protein: 2, kcal: 1, source: "off", name: "x" } as FoodData;
    expect(fingerprint(a)).toBe(fingerprint(b));
  });
  test("ignore la date de modification, pas le contenu", () => {
    expect(fingerprint(food({ updatedAt: 99 }))).toBe(fingerprint(food()));
    expect(fingerprint(food({ kcal: 61 }))).not.toBe(fingerprint(food()));
  });
});

describe("différence", () => {
  test("tout est nouveau avec une carte vide", () => {
    const out = diffLibrary([item("a"), item("b")], {});
    expect(out.map((o) => [o.id, o.op])).toEqual([["a", "upsert"], ["b", "upsert"]]);
  });
  test("rien à envoyer si rien n'a changé", () => {
    const map = { [keyOf("food", "a")]: fingerprint(food()) };
    expect(diffLibrary([item("a")], map)).toEqual([]);
  });
  test("envoie ce qui a changé", () => {
    const map = { [keyOf("food", "a")]: fingerprint(food()) };
    const out = diffLibrary([item("a", { kcal: 70 })], map);
    expect(out).toHaveLength(1);
    expect(out[0].op).toBe("upsert");
  });
  test("archive ce qui a disparu", () => {
    const out = diffLibrary([], { "menu:m1": "zz", "food:f:1": "yy" });
    expect(out).toEqual([
      { kind: "menu", id: "m1", op: "archive" },
      { kind: "food", id: "f:1", op: "archive" },
    ]);
  });
});

describe("carte", () => {
  test("mise à jour pour les seuls éléments terminés", () => {
    const sent = diffLibrary([item("a"), item("b")], { "menu:m": "old" }).concat([{ kind: "menu", id: "m", op: "archive" }]);
    const map = applyDone({ "menu:m": "old" }, sent, ["a", "m"]);
    expect(map).toEqual({ [keyOf("food", "a")]: fingerprint(food()) });
  });
  test("paquets de 10", () => {
    expect(chunk(Array.from({ length: 23 }, (_, i) => i), 10).map((c) => c.length)).toEqual([10, 10, 3]);
  });
});

describe("retard", () => {
  const day = 86_400_000;
  test("seulement après le seuil", () => {
    expect(isLate(null, 10 * day, 3)).toBe(false);
    expect(isLate(10 * day - 2 * day, 10 * day, 3)).toBe(false);
    expect(isLate(10 * day - 3 * day, 10 * day, 3)).toBe(true);
  });
});
