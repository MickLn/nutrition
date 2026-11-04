import "fake-indexeddb/auto";
import { beforeEach, expect, test } from "vitest";
import { DEFAULT_PROFILE } from "@/config/profile";
import { REVIEW } from "@/config/review";
import { addDays } from "@/lib/dates";
import { db } from "@/lib/db";
import { PROFILE_KEY } from "@/features/profile/profile";
import { loadRecords } from "./adjustments";
import { ensureWeeklyAdjustment, planAdjustment } from "./auto-adjust";

const TODAY = "2026-11-04"; // mercredi : la dernière semaine finie commence le 26/10
const flat = (days: number) => Array.from({ length: days }, (_, ago) => ({ date: addDays("2026-11-03", -ago), kg: 72 }));
const falling = (days: number) => Array.from({ length: days }, (_, ago) => ({ date: addDays("2026-11-03", -ago), kg: 72 + ago * 0.07 }));
const profile = { ...DEFAULT_PROFILE, sex: "m" as const, adjustCapKcal: 100 as const };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  await db.settings.put({ key: PROFILE_KEY, value: profile });
});

const seedWeights = (rows: { date: string; kg: number }[]) =>
  db.weights.bulkAdd(rows.map((w, i) => ({ id: "w" + i, ...w, source: "manual" as const, updatedAt: i })));

test("plateau de 3 semaines : −cap enregistré pour la semaine, avec avant et après", () => {
  const r = planAdjustment(TODAY, profile, flat(40), []);
  expect(r).toMatchObject({ week: "2026-10-26", at: TODAY, delta: -100, reason: "stalled-3w" });
  expect(r!.kcalAfter).toBe(r!.kcalBefore - 100);
});

test("la moyenne baisse : une ligne à 0 est quand même enregistrée (la semaine est traitée)", () => {
  expect(planAdjustment(TODAY, profile, falling(40), [])).toMatchObject({ delta: 0, reason: "on-track" });
});

test("pas d'ajustement sans bilan disponible", () => {
  expect(planAdjustment(TODAY, profile, flat(3), [])).toBeNull();
  // Lundi 2 novembre : la semaine du 26/10 est disponible ; dimanche 1er : seulement celle du 19/10, pas rattrapée.
  expect(planAdjustment("2026-11-01", profile, flat(40), [])).toMatchObject({ week: "2026-10-19" });
  expect(planAdjustment("2026-11-11", profile, flat(40).slice(0, 5), [])).toBeNull();
});

test("le plafond du profil est respecté", () => {
  const r = planAdjustment(TODAY, { ...profile, adjustCapKcal: 50 }, flat(40), []);
  expect(r?.delta).toBe(-50);
});

test("une seule ligne par semaine, même appelée plusieurs fois en même temps", async () => {
  await seedWeights(flat(40));
  const results = await Promise.all([ensureWeeklyAdjustment(TODAY), ensureWeeklyAdjustment(TODAY), ensureWeeklyAdjustment(TODAY)]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(await ensureWeeklyAdjustment(TODAY)).toBeNull();
  const records = await loadRecords();
  expect(records).toHaveLength(1);
  expect(await db.settings.get(REVIEW.settingsKey)).toBeTruthy();
});

test("la semaine suivante ajoute une ligne, cumulée sur la précédente", async () => {
  await seedWeights(Array.from({ length: 60 }, (_, ago) => ({ date: addDays("2026-11-10", -ago), kg: 72 })));
  await ensureWeeklyAdjustment(TODAY);
  await ensureWeeklyAdjustment("2026-11-11");
  const records = await loadRecords();
  expect(records.map((r) => r.week)).toEqual(["2026-10-26", "2026-11-02"]);
  expect(records[1].kcalBefore).toBe(records[0].kcalAfter);
});
