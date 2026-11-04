import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { importHealthWeights } from "./import";
import { parseHealthParams, templateUrl, uniqueWeights } from "./parse";

const today = "2026-11-04";

describe("parseHealthParams", () => {
  it("lit une pesée simple dans le fragment", () => {
    expect(parseHealthParams("#kg=72.4&date=2026-11-03", today)).toEqual({ ok: true, items: [{ date: "2026-11-03", kg: 72.4 }] });
  });
  it("utilise aujourd'hui sans date, accepte la virgule et le ?", () => {
    expect(parseHealthParams("?kg=72,4", today)).toEqual({ ok: true, items: [{ date: today, kg: 72.4 }] });
  });
  it("lit plusieurs pesées", () => {
    const r = parseHealthParams("#w=2026-11-03:72.6,2026-11-04:72.4", today);
    expect(r).toEqual({ ok: true, items: [{ date: "2026-11-03", kg: 72.6 }, { date: "2026-11-04", kg: 72.4 }] });
  });
  it("refuse sans paramètre", () => {
    expect(parseHealthParams("", today)).toEqual({ ok: false, error: "empty" });
    expect(parseHealthParams("#w=", today)).toEqual({ ok: false, error: "empty" });
  });
  it("refuse un format invalide", () => {
    for (const h of ["#kg=abc", "#kg=72.4kg", "#kg=-72", "#kg=72.4&date=04/11/2026", "#kg=72.4&date=2026-02-31", "#w=2026-11-03", "#w=2026-11-03:72.4,oops"])
      expect(parseHealthParams(h, today), h).toEqual({ ok: false, error: "format" });
  });
  it("refuse un poids hors bornes", () => {
    expect(parseHealthParams("#kg=24.9", today)).toEqual({ ok: false, error: "kg" });
    expect(parseHealthParams("#kg=351", today)).toEqual({ ok: false, error: "kg" });
    expect(parseHealthParams("#kg=25", today).ok).toBe(true);
  });
  it("refuse une date future ou trop ancienne", () => {
    expect(parseHealthParams("#kg=72&date=2026-11-05", today)).toEqual({ ok: false, error: "future" });
    expect(parseHealthParams("#kg=72&date=2020-01-01", today)).toEqual({ ok: false, error: "old" });
  });
  it("tout ou rien : une valeur invalide refuse le lot", () => {
    expect(parseHealthParams("#w=2026-11-03:72.6,2026-11-04:999", today)).toEqual({ ok: false, error: "kg" });
  });
  it("refuse un lot trop gros", () => {
    const w = Array.from({ length: 32 }, () => "2026-11-03:72").join(",");
    expect(parseHealthParams(`#w=${w}`, today)).toEqual({ ok: false, error: "many" });
  });
});

describe("doublons", () => {
  beforeEach(async () => {
    await db.weights.clear();
  });
  it("retire les doublons du lot", () => {
    expect(uniqueWeights([{ date: "2026-11-03", kg: 72 }, { date: "2026-11-03", kg: 72 }, { date: "2026-11-03", kg: 72.2 }])).toHaveLength(2);
  });
  it("enregistre avec la source health puis ignore le doublon", async () => {
    expect(await importHealthWeights([{ date: "2026-11-03", kg: 72.4 }])).toEqual({ added: 1, skipped: 0 });
    expect(await importHealthWeights([{ date: "2026-11-03", kg: 72.4 }])).toEqual({ added: 0, skipped: 1 });
    expect(await db.weights.count()).toBe(1);
    expect((await db.weights.toArray())[0].source).toBe("health");
  });
  it("garde une pesée du même jour avec un autre poids", async () => {
    await importHealthWeights([{ date: "2026-11-03", kg: 72.4 }]);
    expect((await importHealthWeights([{ date: "2026-11-03", kg: 72.1 }])).added).toBe(1);
  });
});

it("construit l'adresse modèle", () => {
  expect(templateUrl("https://x.app")).toBe("https://x.app/sante/#kg=[poids]&date=[date]");
});
