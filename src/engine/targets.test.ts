import { expect, test } from "vitest";
import { bmr, macrosFor, startTargets } from "./targets";
import { DEFAULT_PROFILE as me, profileSchema } from "@/config/profile";

test("bmr Mifflin homme", () => expect(Math.round(bmr(me, 72.4))).toBe(1692));
test("cible de départ en sèche à 72,4 kg", () => {
  const t = startTargets(me, 72.4);
  expect(Math.round(t.deficit)).toBe(557);
  expect(Math.round(t.kcal / 10) * 10).toBe(2060);
  expect(Math.round(t.protein)).toBe(145);
  expect(t.floorApplied).toBe(false);
});
test("le déficit ne dépasse jamais 0,9 kg/semaine", () => {
  expect(Math.round(startTargets(me, 150).deficit)).toBe(990);
});
test("le plancher l'emporte", () => {
  const t = startTargets({ ...me, sex: "f", age: 60, heightCm: 150, activity: 1.2 }, 50);
  expect(t.kcal).toBe(1200);
  expect(t.floorApplied).toBe(true);
});
test("plancher de lipides à 0,5 g/kg", () => {
  expect(macrosFor(1500, { ...me, fatPct: 0.15 }, 72.4).fat).toBeCloseTo(36.2, 1);
});
test("glucides = reste ÷ 4, jamais négatifs", () => {
  expect(macrosFor(800, me, 120).carbs).toBe(0);
});
test("le profil accepte des protéines changées à la main (avertissement) mais refuse au-delà de 3,5 g/kg", () => {
  expect(profileSchema.safeParse(me).success).toBe(true);
  expect(profileSchema.safeParse({ ...me, proteinGPerKg: 2.6 }).success).toBe(true);
  expect(profileSchema.safeParse({ ...me, proteinGPerKg: 3.6 }).success).toBe(false);
  expect(profileSchema.safeParse({ ...me, activity: 1.3 }).success).toBe(false);
});
