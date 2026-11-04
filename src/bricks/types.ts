export type BrickId =
  | "menus" | "batch" | "cooked" | "protein-suggest" | "body" | "weekly" | "scanner" | "water" | "health-import"
  | "goal-modes" | "bmi" | "onboarding" | "week-budget" | "micros" | "strava" | "notion-sync";

/** Une brique : une fonction optionnelle, allumée ou éteinte par un réglage. Son nom visible est dans les fichiers de langue (`bricks.<id>`). */
export type Brick = { id: BrickId; defaultOn: boolean; shelved: boolean };
