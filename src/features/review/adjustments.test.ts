import { expect, test } from "vitest";
import { DEFAULT_PROFILE } from "@/config/profile";
import { startTargets } from "@/engine/targets";
import { adjustTargets, applyAdjustments, inCooldown, kcalAtWeek, parseRecords, totalAdjustment, type AdjustmentRecord } from "./adjustments";

const rec = (week: string, delta: number, status: "accepted" | "refused" = "accepted", at = week): AdjustmentRecord => ({
  week,
  at,
  delta,
  kcalBefore: 2060,
  kcalAfter: 2060 + delta,
  status,
});

test("le cumul ignore les ajustements refusés", () => {
  expect(totalAdjustment([rec("2026-10-12", -100), rec("2026-10-19", -100, "refused"), rec("2026-10-26", 50)])).toBe(-50);
});
test("le plancher l'emporte sur le cumul", () => {
  expect(applyAdjustments(1550, -100, "m")).toBe(1500);
  expect(applyAdjustments(1250, -100, "f")).toBe(1200);
  expect(applyAdjustments(2060, -100, "m")).toBe(1960);
  expect(applyAdjustments(2060, 0, "m")).toBe(2060);
});
test("l'objectif d'une semaine passée n'inclut pas les ajustements décidés ensuite", () => {
  const r = [rec("2026-10-12", -100), rec("2026-10-26", -100)];
  expect(kcalAtWeek(1860, r, "2026-10-26")).toBe(1960);
  expect(kcalAtWeek(1860, r, "2026-10-12")).toBe(2060);
  expect(kcalAtWeek(1860, r, "2026-11-02")).toBe(1860);
});
test("un ajustement accepté récemment bloque une nouvelle proposition", () => {
  expect(inCooldown([rec("2026-10-26", -100, "accepted", "2026-11-02")], "2026-11-04")).toBe(true);
  expect(inCooldown([rec("2026-10-26", -100, "accepted", "2026-11-02")], "2026-11-16")).toBe(false);
  expect(inCooldown([rec("2026-10-26", -100, "refused", "2026-11-02")], "2026-11-04")).toBe(false);
});
test("un réglage abîmé donne une liste vide", () => {
  expect(parseRecords("x")).toEqual([]);
  expect(parseRecords([{ week: 1 }, rec("2026-10-12", -100)])).toHaveLength(1);
});

test("la cible du jour tient compte des ajustements acceptés, plancher compris", () => {
  const p = { ...DEFAULT_PROFILE, sex: "m" as const };
  const base = startTargets(p, 72);
  const adj = adjustTargets(base, p, 72, -100);
  expect(adj.kcal).toBeCloseTo(base.kcal - 100);
  expect(adj.protein).toBe(base.protein);
  expect(adj.carbs).toBeLessThan(base.carbs);
  expect(adjustTargets(base, p, 72, 0)).toBe(base);
  const floor = adjustTargets(base, p, 72, -10_000);
  expect(floor.kcal).toBe(1500);
  expect(floor.floorApplied).toBe(true);
});
