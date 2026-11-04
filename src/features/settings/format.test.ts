import { describe, expect, test } from "vitest";
import { daysBetween, elapsed, size } from "./format";

const now = Date.UTC(2026, 10, 4, 12);

describe("elapsed", () => {
  test("à l'instant sous une minute", () => expect(elapsed(now - 30_000, now)).toEqual({ unit: "now", n: 0 }));
  test("minutes", () => expect(elapsed(now - 5 * 60_000, now)).toEqual({ unit: "min", n: 5 }));
  test("heures", () => expect(elapsed(now - 3.5 * 3_600_000, now)).toEqual({ unit: "h", n: 3 }));
  test("jours", () => expect(elapsed(now - 3 * 86_400_000 - 1000, now)).toEqual({ unit: "day", n: 3 }));
  test("date dans le futur ramenée à maintenant", () => expect(elapsed(now + 1000, now)).toEqual({ unit: "now", n: 0 }));
});

describe("daysBetween", () => {
  test("même jour", () => expect(daysBetween("2026-11-04", "2026-11-04")).toBe(0));
  test("hier", () => expect(daysBetween("2026-11-03", "2026-11-04")).toBe(1));
  test("à travers le changement d'heure", () => expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2));
});

describe("size", () => {
  test("ko", () => expect(size(500 * 1024)).toEqual({ n: 500, digits: 0, unit: "ko" }));
  test("Mo avec une décimale sous 10", () => expect(size(2.5 * 1024 * 1024)).toEqual({ n: 2.5, digits: 1, unit: "mo" }));
  test("Mo entiers", () => expect(size(12 * 1024 * 1024)).toEqual({ n: 12, digits: 0, unit: "mo" }));
  test("Go", () => expect(size(1.5 * 1024 ** 3)).toEqual({ n: 1.5, digits: 1, unit: "go" }));
  test("zéro", () => expect(size(0)).toEqual({ n: 0, digits: 0, unit: "ko" }));
});
