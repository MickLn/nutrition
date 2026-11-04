import { expect, test } from "vitest";
import { cn } from "./utils";

test("cn garde la taille de texte du thème à côté d'une couleur", () => {
  expect(cn("text-petit", "text-actif")).toBe("text-petit text-actif");
  expect(cn("text-mono-petit text-texte-discret", "text-actif")).toBe("text-mono-petit text-actif");
  expect(cn("text-corps", "text-petit")).toBe("text-petit");
});
