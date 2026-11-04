import { expect, test } from "vitest";
import { mealFromTime, portionShortcut, quantityCheck } from "./entry";

test("créneau déduit de l'heure", () => {
  expect(mealFromTime("00:30")).toBe("snack");
  expect(mealFromTime("07:15")).toBe("breakfast");
  expect(mealFromTime("12:00")).toBe("lunch");
  expect(mealFromTime("16:00")).toBe("snack");
  expect(mealFromTime("20:00")).toBe("dinner");
});
test("raccourci de portion", () => {
  expect(portionShortcut([250, 250])).toBe(250);
  expect(portionShortcut([250])).toBeNull();
  expect(portionShortcut([250, 250, 250, 600])).toBe(250);
  expect(portionShortcut([])).toBeNull();
});
test("alerte de quantité", () => {
  expect(quantityCheck(25, [250, 250, 250])).toBe("check");
  expect(quantityCheck(25, [250])).toBe("ok");
  expect(quantityCheck(300, [250, 250, 250])).toBe("ok");
});
