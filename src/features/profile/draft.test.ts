import { expect, test } from "vitest";
import { DEFAULT_PROFILE } from "@/config/profile";
import { decimals, latestWeight, profileBounds, withStrength } from "./draft";

test("bornes lues dans le schéma, champs facultatifs compris", () => {
  expect(profileBounds("age")).toEqual({ min: 15, max: 100 });
  expect(profileBounds("heightCm")).toEqual({ min: 120, max: 230 });
  expect(profileBounds("goalKg")).toEqual({ min: 25, max: 350 });
  expect(profileBounds("fiberG")).toEqual({ min: 0, max: 100 });
});
test("Musculation éteinte : 1,6 g/kg et 35 % ; rallumée : 2,0 et 25 %", () => {
  const off = withStrength(DEFAULT_PROFILE, false);
  expect(off).toMatchObject({ strength: false, proteinGPerKg: 1.6, fatPct: 0.35 });
  expect(withStrength(off, true)).toMatchObject({ strength: true, proteinGPerKg: 2, fatPct: 0.25 });
  const custom = { ...DEFAULT_PROFILE, proteinGPerKg: 2.2 };
  expect(withStrength(custom, true)).toBe(custom);
});
test("dernière pesée : jour le plus récent, puis saisie la plus récente", () => {
  const rows = [
    { date: "2026-11-02", kg: 73, updatedAt: 5 },
    { date: "2026-11-03", kg: 72.6, updatedAt: 1 },
    { date: "2026-11-03", kg: 72.4, updatedAt: 2 },
  ];
  expect(latestWeight(rows)?.kg).toBe(72.4);
  expect(latestWeight([])).toBeNull();
});
test("décimales d'un coefficient", () => {
  expect(decimals(1.2)).toBe(1);
  expect(decimals(1.375)).toBe(3);
  expect(decimals(2)).toBe(0);
});
