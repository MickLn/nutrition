import { expect, test } from "vitest";
import { weeklyAdjust, type AdjustInput } from "./adjust";
import { addDays } from "@/lib/dates";
import fr from "@/i18n/fr.json";
import en from "@/i18n/en.json";

const T = "2026-11-04";
/** Une pesée par jour pendant `days` jours, poids donné par f(jours avant aujourd'hui). */
const series = (days: number, f: (ago: number) => number) =>
  Array.from({ length: days }, (_, ago) => ({ date: addDays(T, -ago), kg: f(ago) }));
const base: Omit<AdjustInput, "weights"> = { currentKcal: 2060, sex: "m", today: T, capKcal: 100 };

test("moins de 14 jours de pesées : aucun changement", () => {
  const a = weeklyAdjust({ ...base, weights: series(10, () => 72) });
  expect(a).toMatchObject({ reason: "not-enough-data", delta: 0 });
});
test("perte dans la fourchette : rien", () => {
  const a = weeklyAdjust({ ...base, weights: series(28, (ago) => 72 + ago * 0.07) });
  expect(a).toMatchObject({ reason: "on-track", delta: 0 });
});
test("stagnation 2 semaines : rien", () => {
  const a = weeklyAdjust({ ...base, weights: series(28, (ago) => (ago <= 20 ? 72 : 72 + (ago - 20) * 0.1)) });
  expect(a).toMatchObject({ reason: "stalled-2w", delta: 0 });
});
test("stagnation 3 semaines : −cap", () => {
  const a = weeklyAdjust({ ...base, weights: series(28, () => 72) });
  expect(a).toMatchObject({ reason: "stalled-3w", delta: -100, newKcal: 1960 });
});
test("perte trop rapide : +cap", () => {
  const a = weeklyAdjust({ ...base, weights: series(28, (ago) => 72 + ago * 0.2) });
  expect(a).toMatchObject({ reason: "too-fast", delta: 100 });
});
test("le plancher l'emporte et l'explication le dit", () => {
  const a = weeklyAdjust({ ...base, currentKcal: 1520, weights: series(28, () => 72) });
  expect(a).toMatchObject({ reason: "floor", newKcal: 1500, delta: -20 });
});
test("le delta ne dépasse jamais le plafond", () => {
  for (const cap of [50, 100, 150] as const) {
    const a = weeklyAdjust({ ...base, capKcal: cap, weights: series(28, () => 72) });
    expect(Math.abs(a.delta)).toBeLessThanOrEqual(cap);
  }
});
test("chaque explication existe en français et en anglais", () => {
  for (const r of ["not-enough-data", "on-track", "stalled-2w", "stalled-3w", "too-fast", "floor"]) {
    expect(fr.adjust).toHaveProperty(r);
    expect(en.adjust).toHaveProperty(r);
  }
});
