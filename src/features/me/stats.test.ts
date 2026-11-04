import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PROFILE } from "@/config/profile";
import { db, type LogEntry } from "@/lib/db";
import { saveProfile } from "@/features/profile/profile";
import { loadTop, loadWeek, topFoods, weekDays, weekSummary } from "./stats";

// Mercredi 4 novembre 2026 : semaine du lundi 2 au dimanche 8.
const TODAY = "2026-11-04";
let seq = 0;

/** Saisie de test : `protein` et `kcal` pour 100 g. */
function entry(date: string, refId: string, grams: number, per100: { kcal: number; protein: number }, name = refId): LogEntry {
  seq += 1;
  return {
    id: `e${seq}`,
    date,
    time: "12:00",
    meal: "lunch",
    refType: "food",
    refId,
    name,
    grams,
    snapshot: { kcal: per100.kcal, protein: per100.protein, carbs: 0, fat: 0, fiber: 0 },
    updatedAt: seq,
  };
}

// 80 kg avec le profil par défaut (2,0 g/kg) : 160 g de protéines par jour.
const weights = [{ date: "2026-11-01", kg: 80 }];
const chicken = { kcal: 165, protein: 31 };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("semaine", () => {
  it("va du lundi au dimanche, même un dimanche ou un lundi", () => {
    expect(weekDays(TODAY)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"]);
    expect(weekDays("2026-11-08")[0]).toBe("2026-11-02");
    expect(weekDays("2026-11-02")[6]).toBe("2026-11-08");
    expect(weekDays("2026-12-31")).toContain("2027-01-03");
  });

  it("compte les jours avec l'objectif de protéines atteint, les jours futurs restent vides", () => {
    const s = weekSummary({
      today: TODAY,
      entries: [entry("2026-11-02", "poulet", 600, chicken), entry("2026-11-03", "poulet", 300, chicken), entry("2026-11-04", "poulet", 520, chicken)],
      water: [],
      weights,
      profile: DEFAULT_PROFILE,
    });
    expect(s.hasGoal).toBe(true);
    expect(s.days.map((d) => d.state)).toEqual(["reached", "missed", "reached", "future", "future", "future", "future"]);
    expect(s.reached).toBe(2);
  });

  it("sans pesée : pas d'objectif, aucun jour atteint", () => {
    const s = weekSummary({ today: TODAY, entries: [entry("2026-11-02", "poulet", 900, chicken)], water: [], weights: [], profile: DEFAULT_PROFILE });
    expect(s.hasGoal).toBe(false);
    expect(s.reached).toBe(0);
    expect(s.hasData).toBe(true);
  });

  it("moyenne des calories sur les seuls jours saisis, eau comptée contre l'objectif du profil", () => {
    const s = weekSummary({
      today: TODAY,
      entries: [entry("2026-11-02", "a", 1000, { kcal: 200, protein: 0 }), entry("2026-11-04", "a", 1000, { kcal: 300, protein: 0 }), entry("2026-11-09", "a", 1000, { kcal: 900, protein: 0 })],
      water: [
        { date: "2026-11-02", ml: 1000 },
        { date: "2026-11-02", ml: 500 },
        { date: "2026-11-03", ml: 1200 },
      ],
      weights,
      profile: { ...DEFAULT_PROFILE, waterL: 1.5 },
    });
    expect(s.kcalAvg).toBe(2500);
    expect(s.waterDays).toBe(1);
  });

  it("semaine vide : rien à montrer", () => {
    const s = weekSummary({ today: TODAY, entries: [], water: [], weights: [], profile: DEFAULT_PROFILE });
    expect(s).toMatchObject({ hasData: false, kcalAvg: null, reached: 0, waterDays: 0 });
  });

  it("lit la base : profil, saisies, eau et pesées", async () => {
    await saveProfile({ waterL: 2 });
    await db.weights.add({ id: "w1", date: "2026-11-03", kg: 80, source: "manual", updatedAt: 1 });
    await db.logEntries.bulkAdd([entry("2026-11-03", "poulet", 600, chicken), entry("2026-10-30", "poulet", 600, chicken)]);
    await db.water.add({ id: "o1", date: "2026-11-03", ml: 2000, updatedAt: 1 });
    const s = await loadWeek(TODAY);
    // Le lundi n'a pas encore de pesée dans ses 7 jours : pas d'objectif ce jour-là.
    expect(s.days.slice(0, 3).map((d) => d.state)).toEqual(["missed", "reached", "missed"]);
    expect(s.waterDays).toBe(1);
    expect(Math.round(s.kcalAvg!)).toBe(990);
  });
});

describe("top", () => {
  it("classe par nombre de saisies, nom le plus récent, portion habituelle", () => {
    const rows = [
      entry(TODAY, "avoine", 55, { kcal: 370, protein: 13 }, "Avoine"),
      entry(TODAY, "avoine", 55, { kcal: 370, protein: 13 }, "Avoine"),
      entry(TODAY, "avoine", 80, { kcal: 370, protein: 13 }, "Flocons d'avoine"),
      entry(TODAY, "poulet", 140, chicken, "Poulet"),
      entry(TODAY, "poulet", 200, chicken, "Poulet"),
      entry(TODAY, "banane", 120, { kcal: 90, protein: 1 }, "Banane"),
    ];
    const top = topFoods(rows, "eaten", 2);
    expect(top.map((i) => [i.name, i.count, i.usualGrams])).toEqual([
      ["Flocons d'avoine", 3, 55],
      ["Poulet", 2, null],
    ]);
    expect(topFoods(rows, "protein", 10)[0].refId).toBe("poulet");
  });

  it("ne garde que la période demandée", async () => {
    await db.logEntries.bulkAdd([entry(TODAY, "a", 100, chicken), entry("2026-10-06", "b", 100, chicken), entry("2026-10-05", "b", 100, chicken)]);
    expect((await loadTop(TODAY, 30, "eaten", 10)).map((i) => [i.refId, i.count])).toEqual([
      ["a", 1],
      ["b", 1],
    ]);
    expect(await loadTop(TODAY, 7, "eaten", 10)).toHaveLength(1);
  });
});
