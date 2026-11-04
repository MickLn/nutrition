import { expect, test } from "vitest";
import { average7, trendSeries, weighInStatus } from "./weight";

const T = "2026-11-04";
test("3 pesées sur 7 jours donnent leur moyenne", () => {
  const w = [{ date: "2026-11-04", kg: 72 }, { date: "2026-11-01", kg: 73 }, { date: "2026-10-29", kg: 74 }, { date: "2026-10-28", kg: 99 }];
  expect(average7(w, T)).toBe(73);
});
test("aucune pesée donne null, jamais NaN", () => expect(average7([], T)).toBeNull());
test("plusieurs pesées le même jour : seule la dernière compte", () => {
  expect(average7([{ date: T, kg: 73, at: 1 }, { date: T, kg: 72, at: 2 }], T)).toBe(72);
});
test("statut de pesée", () => {
  expect(weighInStatus([{ date: "2026-11-03", kg: 72 }], T)).toBe("ok");
  expect(weighInStatus([{ date: "2026-11-02", kg: 72 }], T)).toBe("late");
  expect(weighInStatus([{ date: "2026-10-28", kg: 72 }], T)).toBe("incomplete");
  expect(weighInStatus([], T)).toBe("incomplete");
});
test("série de tendance", () => {
  const s = trendSeries([{ date: "2026-11-03", kg: 72 }], "2026-11-02", T);
  expect(s.map((p) => p.avg)).toEqual([null, 72, 72]);
});
