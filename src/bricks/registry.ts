import type { Brick, BrickId } from "./types";

/** Allumées par défaut pour MickLn ; « rangées » = prêtes mais pas encore codées. */
export const BRICKS: readonly Brick[] = [
  ...(["menus", "batch", "cooked", "protein-suggest", "body", "weekly", "scanner", "water", "health-import"] as const).map(
    (id) => ({ id, defaultOn: true, shelved: false }),
  ),
  ...(["goal-modes", "bmi", "onboarding", "week-budget", "micros", "strava", "notion-sync"] as const).map(
    (id) => ({ id, defaultOn: false, shelved: true }),
  ),
];

/** Une brique rangée reste éteinte, même si un réglage l'allume. */
export function isOn(id: BrickId, overrides: Partial<Record<BrickId, boolean>> = {}): boolean {
  const b = BRICKS.find((x) => x.id === id);
  if (!b || b.shelved) return false;
  return overrides[id] ?? b.defaultOn;
}
