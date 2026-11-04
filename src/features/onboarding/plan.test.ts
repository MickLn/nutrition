import { expect, test } from "vitest";
import { DEFAULT_PROFILE, STRENGTH_DEFAULTS } from "@/config/profile";
import { bmr, startTargets, tdee } from "@/engine/targets";
import { decimals, goalPreview, profilePatch, type OnboardingAnswers } from "./plan";

const answers: OnboardingAnswers = { sex: "m", age: 30, heightCm: 178, activity: 1.55, strength: true };

test("le patch reprend les défauts liés à Musculation", () => {
  expect(profilePatch(answers)).toMatchObject(STRENGTH_DEFAULTS.on);
  expect(profilePatch({ ...answers, strength: false })).toMatchObject(STRENGTH_DEFAULTS.off);
});

test("l'aperçu vient du moteur avec le poids saisi", () => {
  const g = goalPreview(DEFAULT_PROFILE, answers, 72.4);
  expect(g.bmr).toBe(bmr(g.profile, 72.4));
  expect(g.targets).toEqual(startTargets(g.profile, 72.4));
  expect(g.targets.kcal).toBeCloseTo(tdee(g.profile, 72.4) - g.targets.deficit);
  expect(Math.round(g.targets.protein)).toBe(145);
});

test("couper Musculation baisse les protéines", () => {
  const on = goalPreview(DEFAULT_PROFILE, answers, 72.4);
  const off = goalPreview(DEFAULT_PROFILE, { ...answers, strength: false }, 72.4);
  expect(off.profile.proteinGPerKg).toBe(STRENGTH_DEFAULTS.off.proteinGPerKg);
  expect(off.targets.protein).toBeLessThan(on.targets.protein);
});

test("décimales d'un coefficient", () => {
  expect(decimals(1.2)).toBe(1);
  expect(decimals(1.55)).toBe(2);
  expect(decimals(1.375)).toBe(3);
  expect(decimals(2)).toBe(0);
});
