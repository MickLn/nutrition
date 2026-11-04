import { expect, test } from "vitest";
import { cleanCode, isValidGtin } from "./gtin";

test("codes valables : EAN-13, EAN-8, UPC-A", () => {
  expect(isValidGtin("3017620422003")).toBe(true);
  expect(isValidGtin("96385074")).toBe(true);
  expect(isValidGtin("036000291452")).toBe(true);
});

test("chiffre de contrôle faux, lettres ou mauvaise longueur : refusé", () => {
  expect(isValidGtin("3017620422004")).toBe(false);
  expect(isValidGtin("30176204220a3")).toBe(false);
  expect(isValidGtin("12345")).toBe(false);
  expect(isValidGtin("")).toBe(false);
});

test("les espaces et tirets d'une saisie à la main sont retirés", () => {
  expect(cleanCode(" 3 017620-422003 ")).toBe("3017620422003");
});
