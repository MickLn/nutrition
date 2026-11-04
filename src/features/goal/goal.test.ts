import { expect, test } from "vitest";
import {
  adjustCapOf,
  arrivalDate,
  daysBetween,
  defaultProtein,
  earliestDate,
  isTooFast,
  maxPctPerWeek,
  minGoalKg,
  monthGrid,
  monthPart,
  proteinWarning,
  requiredPctPerWeek,
  weeksToGoal,
  weeklyLossKg,
} from "./goal";

test("72,4 → 68 kg à 0,7 %/sem. : un peu moins de 9 semaines", () => {
  const w = weeksToGoal(72.4, 68, 0.007);
  expect(w).toBeGreaterThan(8.8);
  expect(w).toBeLessThan(9);
});
test("déjà atteint : 0 semaine, date = aujourd'hui", () => {
  expect(weeksToGoal(68, 70, 0.007)).toBe(0);
  expect(arrivalDate("2026-11-04", 68, 70, 0.007)).toBe("2026-11-04");
});
test("date estimée depuis mi-octobre : vers mi-décembre (maquette)", () => {
  const d = arrivalDate("2026-10-15", 72.4, 68, 0.007)!;
  expect(d).toBe("2026-12-17");
  expect(monthPart(d)).toBe("mid");
});
test("la perte d'une semaine est plafonnée à 0,9 kg", () => {
  expect(weeklyLossKg(150, 0.01)).toBe(0.9);
  expect(weeklyLossKg(72.4, 0.007)).toBeCloseTo(0.5068);
});
test("rythme nul : jamais atteint", () => {
  expect(weeksToGoal(80, 70, 0)).toBe(Infinity);
  expect(arrivalDate("2026-11-04", 80, 70, 0)).toBeNull();
});
test("rythme max : 0,7 % avec Musculation, 1 % sans", () => {
  expect(maxPctPerWeek(true)).toBe(0.007);
  expect(maxPctPerWeek(false)).toBe(0.01);
});
test("rythme nécessaire pour une date", () => {
  expect(requiredPctPerWeek(72.4, 68, "2026-11-04", "2026-11-04")).toBe(Infinity);
  expect(requiredPctPerWeek(68, 70, "2026-11-04", "2026-12-01")).toBe(0);
  const pct = requiredPctPerWeek(72.4, 68, "2026-11-04", "2027-02-03");
  expect(pct).toBeGreaterThan(0.004);
  expect(pct).toBeLessThan(0.005);
});
test("date trop proche : trop rapide, avec la date la plus proche raisonnable", () => {
  const earliest = earliestDate("2026-11-04", 72.4, 68, true)!;
  expect(isTooFast("2026-11-04", 72.4, 68, true, "2026-12-15")).toBe(true);
  expect(isTooFast("2026-11-04", 72.4, 68, true, earliest)).toBe(false);
  // Sans Musculation, 1 %/sem. est accepté : une date plus proche passe.
  expect(isTooFast("2026-11-04", 72.4, 68, false, "2026-12-20")).toBe(false);
});
test("jours entre deux dates, changement d'heure compris", () => {
  expect(daysBetween("2026-10-20", "2026-11-03")).toBe(14);
  expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
});
test("poids visé minimum : IMC 18,5", () => expect(minGoalKg(178)).toBe(58.7));
test("début, mi-, fin de mois", () => {
  expect(monthPart("2026-12-01")).toBe("early");
  expect(monthPart("2026-12-10")).toBe("early");
  expect(monthPart("2026-12-11")).toBe("mid");
  expect(monthPart("2026-12-21")).toBe("late");
});
test("ajustement max par défaut 100 kcal", () => {
  expect(adjustCapOf({})).toBe(100);
  expect(adjustCapOf({ adjustCapKcal: 150 })).toBe(150);
});
test("protéines : défaut et avertissement hors 1,6 à 2,2", () => {
  expect(defaultProtein(true)).toBe(2);
  expect(defaultProtein(false)).toBe(1.6);
  expect(proteinWarning(2.6)).toBe("high");
  expect(proteinWarning(1.2)).toBe("low");
  expect(proteinWarning(2.2)).toBeNull();
});
test("grille de décembre 2026 : commence un mardi, 5 semaines", () => {
  const g = monthGrid(2026, 12);
  expect(g).toHaveLength(5);
  expect(g[0]).toEqual([null, "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"]);
  expect(g[4].slice(0, 4)).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"]);
  expect(g[4][4]).toBeNull();
});
