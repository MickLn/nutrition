import { describe, expect, it } from "vitest";
import { recentDay, signed } from "./format";

const fmt = (v: number, d: number) => v.toFixed(d).replace(".", ",");

describe("signed", () => {
  it("met un vrai signe moins ou plus", () => {
    expect(signed(fmt, -2.46)).toBe("−2,5");
    expect(signed(fmt, 0.4)).toBe("+0,4");
  });
  it("pas de signe quand l'écart arrondi est nul", () => {
    expect(signed(fmt, -0.04)).toBe("0,0");
  });
});

describe("recentDay", () => {
  it("nomme le jour dans la semaine écoulée, sinon la date", () => {
    expect(recentDay("fr-FR", "2026-10-29", "2026-11-04", 7)).toBe("jeudi");
    expect(recentDay("fr-FR", "2026-10-09", "2026-11-04", 7)).toBe("9 oct.");
  });
});
