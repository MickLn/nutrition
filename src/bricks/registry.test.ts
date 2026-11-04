import { expect, test } from "vitest";
import { BRICKS, isOn } from "./registry";
import fr from "@/i18n/fr.json";

test("une brique rangée reste éteinte même si un réglage l'allume", () => expect(isOn("strava", { strava: true })).toBe(false));
test("sans réglage, le défaut s'applique", () => expect(isOn("menus")).toBe(true));
test("un réglage éteint une brique", () => expect(isOn("menus", { menus: false })).toBe(false));
test("chaque brique a un nom dans le fichier de langue", () => {
  for (const b of BRICKS) expect(fr.bricks).toHaveProperty(b.id);
});
