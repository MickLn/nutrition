import { expect, test } from "vitest";
import { t } from ".";
import { LANGUAGES } from "./languages";

type Dict = { [k: string]: string | Dict };
const keys = (d: Dict, p = ""): string[] =>
  Object.entries(d).flatMap(([k, v]) => (typeof v === "string" ? [p + k] : keys(v, `${p}${k}.`)));

test("toutes les langues ont les mêmes clés que le français", () => {
  const ref = keys(LANGUAGES.fr as Dict).sort();
  for (const d of Object.values(LANGUAGES)) expect(keys(d as Dict).sort()).toEqual(ref);
});
test("t remplace les variables et change de langue", () => {
  expect(t("adjust.floor", { kcal: 1500 })).toBe("Objectif bloqué au plancher de 1500 kcal.");
  expect(t("adjust.floor", { kcal: 1500 }, "en")).toBe("Target held at the 1500 kcal floor.");
});
test("clé d'erreur avec un point", () => expect(t("errors.batch.cooked-weight-missing")).toMatch(/Pèse/));
test("clé inconnue : la clé est renvoyée", () => expect(t("nope.key")).toBe("nope.key"));
