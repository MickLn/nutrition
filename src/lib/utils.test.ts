import { expect, test } from "vitest";
import { cn } from "./utils";

test("une taille de texte du thème n'est pas prise pour une couleur", () => {
  expect(cn("text-mono-petit", "text-actif")).toBe("text-mono-petit text-actif");
  expect(cn("text-petit", "text-texte-discret")).toBe("text-petit text-texte-discret");
  expect(cn("text-corps", "text-petit")).toBe("text-petit");
});
