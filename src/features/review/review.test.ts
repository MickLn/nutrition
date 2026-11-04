import { expect, test } from "vitest";
import { addDays } from "@/lib/dates";
import { buildWeek, reviewWeeks, weekStartOf, withinTolerance, type ReviewContext, type ReviewData } from "./review";

const TODAY = "2026-11-04"; // mercredi
const series = (days: number, f: (ago: number) => number) => Array.from({ length: days }, (_, ago) => ({ date: addDays("2026-11-01", -ago), kg: f(ago) }));
const ctx: ReviewContext = { today: TODAY, sex: "m", capKcal: 100, currentKcal: 2060, proteinG: 145, waterL: 2 };
const empty: ReviewData = { entries: [], water: [], weights: [], waists: [], records: [] };
const snap = { kcal: 100, protein: 10, carbs: 10, fat: 2, fiber: 0 };

test("la semaine commence le lundi", () => {
  expect(weekStartOf("2026-11-04")).toBe("2026-11-02");
  expect(weekStartOf("2026-11-01")).toBe("2026-10-26");
  expect(weekStartOf("2026-11-02")).toBe("2026-11-02");
});

test("le bilan de la semaine finie apparaît dès le lundi suivant, avec assez de pesées", () => {
  const weights = series(28, () => 72);
  expect(reviewWeeks({ weights }, "2026-11-04")[0]).toBe("2026-10-26");
  expect(reviewWeeks({ weights }, "2026-11-01")[0]).toBe("2026-10-19");
  expect(reviewWeeks({ weights: series(3, () => 72) }, TODAY)).toEqual([]);
});

test("moyennes, jours de protéines et d'eau", () => {
  const entries = [
    { date: "2026-10-26", grams: 1000, snapshot: snap }, // 1 000 kcal, 100 g
    { date: "2026-10-27", grams: 3000, snapshot: snap }, // 3 000 kcal, 300 g
    { date: "2026-10-27", grams: 0, snapshot: snap },
  ];
  const water = [
    { date: "2026-10-26", ml: 1500 },
    { date: "2026-10-26", ml: 600 },
    { date: "2026-10-27", ml: 1000 },
  ];
  const w = buildWeek({ ...empty, entries, water, weights: series(28, () => 72) }, ctx, "2026-10-26", "2026-10-26");
  expect(w.loggedDays).toBe(2);
  expect(w.avgKcal).toBe(2000);
  expect(w.avgProtein).toBe(200);
  expect(w.proteinDays).toBe(1);
  expect(w.waterDays).toBe(1);
});

test("plateau de 3 semaines : proposition de −100, puis réponse enregistrée", () => {
  const data = { ...empty, weights: series(28, () => 72) };
  const w = buildWeek(data, ctx, "2026-10-26", "2026-10-26");
  expect(w).toMatchObject({ plateau: true, state: "proposal", kcalTarget: 2060, weightDelta: 0 });
  expect(w.adjustment).toMatchObject({ delta: -100, newKcal: 1960 });

  const record = { week: "2026-10-26", at: "2026-11-04", delta: -100, kcalBefore: 2060, kcalAfter: 1960, status: "accepted" as const };
  const after = buildWeek({ ...data, records: [record] }, { ...ctx, currentKcal: 1960 }, "2026-10-26", "2026-10-26");
  expect(after).toMatchObject({ state: "accepted", kcalTarget: 2060 });
});

test("la moyenne baisse : objectif inchangé", () => {
  const w = buildWeek({ ...empty, weights: series(28, (ago) => 72 + ago * 0.07) }, ctx, "2026-10-26", "2026-10-26");
  expect(w).toMatchObject({ plateau: false, state: "steady" });
  expect(w.weightDelta).toBeLessThan(0);
});

test("pas de proposition pour une semaine plus ancienne ni juste après un ajustement accepté", () => {
  const weights = series(35, () => 72);
  expect(buildWeek({ ...empty, weights }, ctx, "2026-10-19", "2026-10-26").state).toBe("steady");
  const recent = { week: "2026-10-19", at: "2026-11-02", delta: -100, kcalBefore: 2160, kcalAfter: 2060, status: "accepted" as const };
  expect(buildWeek({ ...empty, weights, records: [recent] }, ctx, "2026-10-26", "2026-10-26").state).toBe("steady");
});

test("tour de taille : écart avec la mesure précédente", () => {
  const waists = [
    { date: "2026-10-20", cm: 85 },
    { date: "2026-10-29", cm: 84.5 },
  ];
  const w = buildWeek({ ...empty, waists, weights: series(28, () => 72) }, ctx, "2026-10-26", "2026-10-26");
  expect(w.waistCm).toBe(84.5);
  expect(w.waistDelta).toBeCloseTo(-0.5);
});

test("la tolérance de 5 % est désactivée par défaut", () => {
  expect(withinTolerance(2100, 2060)).toBe(false);
});
