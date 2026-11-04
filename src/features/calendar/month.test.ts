import { expect, test } from "vitest";
import { monthGrid, monthOf, monthRange, shiftMonth } from "./month";

test("octobre 2026 commence un jeudi (semaine du lundi)", () => {
  const g = monthGrid({ year: 2026, month: 10 }, 1);
  expect(g[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
  expect(g.every((w) => w.length === 7)).toBe(true);
  expect(g.flat().filter(Boolean)).toHaveLength(31);
  expect(g.at(-1)?.at(-1)).toBeNull();
});

test("changer de mois passe l'année", () => {
  expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  expect(monthOf("2026-02-14")).toEqual({ year: 2026, month: 2 });
  expect(monthRange({ year: 2028, month: 2 })).toEqual(["2028-02-01", "2028-02-29"]);
});
