import { describe, expect, it } from "vitest";
import { buildChart, change, dailySamples, goalProgress, monthStarts, niceTicks, periodFrom, spreadMarks, trendPoints } from "./chart";

describe("dailySamples", () => {
  it("garde la dernière mesure de chaque jour, triée par date", () => {
    const out = dailySamples([
      { date: "2026-10-02", value: 72, at: 1 },
      { date: "2026-10-01", value: 73, at: 1 },
      { date: "2026-10-02", value: 71, at: 5 },
    ]);
    expect(out).toEqual([
      { date: "2026-10-01", value: 73 },
      { date: "2026-10-02", value: 71 },
    ]);
  });
});

describe("periodFrom", () => {
  it("compte les jours en incluant aujourd'hui", () => {
    expect(periodFrom("month", "2026-10-31", null)).toBe("2026-10-02");
  });
  it("« Tout » commence à la première mesure", () => {
    expect(periodFrom("all", "2026-10-31", "2026-09-01")).toBe("2026-09-01");
    expect(periodFrom("all", "2026-10-31", null)).toBe("2026-10-31");
  });
});

describe("niceTicks", () => {
  it("donne des kilos entiers, du haut vers le bas", () => {
    expect(niceTicks(72.2, 75.3, 4)).toEqual([75, 74, 73]);
  });
  it("élargit le pas quand il y aurait trop de graduations", () => {
    expect(niceTicks(60, 80, 4)).toEqual([80, 70, 60]);
  });
  it("tour de taille : deux graduations au plus", () => {
    expect(niceTicks(84.5, 86.6, 2)).toEqual([86, 85]);
  });
});

describe("buildChart", () => {
  it("place la valeur la plus haute en haut et la période sur 0 à 1", () => {
    const m = buildChart(
      [
        { date: "2026-10-01", value: 74 },
        { date: "2026-10-11", value: 72 },
      ],
      [],
      "2026-10-01",
      "2026-10-11",
      4,
    );
    expect(m.dots[0]).toMatchObject({ x: 0, y: 0 });
    expect(m.dots[1]).toMatchObject({ x: 1, y: 1 });
    expect(m.ticks.map((t) => t.value)).toEqual([74, 73, 72]);
    expect(m.ticks[1].y).toBeCloseTo(0.5);
  });
  it("une seule valeur : point au milieu, sans division par zéro", () => {
    const m = buildChart([{ date: "2026-10-01", value: 80 }], [], "2026-10-01", "2026-10-01", 4);
    expect(m.dots[0].y).toBeCloseTo(0.5);
    expect(Number.isFinite(m.dots[0].x)).toBe(true);
  });
  it("ignore les points hors période", () => {
    const m = buildChart([{ date: "2026-09-01", value: 80 }], [], "2026-10-01", "2026-10-11", 4);
    expect(m.dots).toEqual([]);
  });
});

describe("trendPoints et change", () => {
  const weights = [
    { date: "2026-10-01", kg: 75 },
    { date: "2026-10-08", kg: 74 },
    { date: "2026-10-15", kg: 73 },
  ];
  it("saute les jours sans moyenne", () => {
    const pts = trendPoints(weights, "2026-09-25", "2026-10-15");
    expect(pts[0]).toEqual({ date: "2026-10-01", value: 75 });
    expect(pts[pts.length - 1].date).toBe("2026-10-15");
  });
  it("évolution et semaines", () => {
    expect(change([{ date: "2026-10-01", value: 75 }, { date: "2026-10-29", value: 73 }])).toEqual({ delta: -2, weeks: 4 });
    expect(change([{ date: "2026-10-01", value: 75 }])).toBeNull();
  });
});

describe("monthStarts et spreadMarks", () => {
  it("trouve les 1er du mois", () => {
    expect(monthStarts("2026-09-10", "2026-11-04")).toEqual(["2026-10-01", "2026-11-01"]);
  });
  it("écarte les repères trop proches", () => {
    expect(spreadMarks([{ px: 0 }, { px: 10 }, { px: 60 }], 48)).toEqual([{ px: 0 }, { px: 60 }]);
  });
});

describe("goalProgress", () => {
  it("part du chemin parcouru", () => {
    expect(goalProgress(75, 72, 68)).toBeCloseTo(3 / 7);
  });
  it("reste entre 0 et 1", () => {
    expect(goalProgress(75, 80, 68)).toBe(0);
    expect(goalProgress(75, 60, 68)).toBe(1);
    expect(goalProgress(65, 66, 68)).toBeNull();
  });
});
