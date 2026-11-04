/**
 * Règles de calcul réglables. Le moteur lit ces valeurs, il n'en contient aucune.
 * Chaque règle porte son étiquette : "science" (source dans recherche-objectifs.md)
 * ou "conception" (choix de design, à expliquer dans les « Pourquoi ? »).
 */
export const RULES = {
  kcalPerKg: { value: 7700, kind: "science" },
  /** Perte visée par semaine, en part de la moyenne de poids 7 jours. */
  lossPctPerWeek: { value: 0.007, kind: "science" },
  maxLossPctPerWeek: { value: 0.01, kind: "science" },
  maxLossKgPerWeek: { value: 0.9, kind: "conception" },
  kcalFloor: { value: { m: 1500, f: 1200 }, kind: "science" },
  fatFloorGPerKg: { value: 0.5, kind: "science" },
  kcalPerG: { value: { protein: 4, carbs: 4, fat: 9 }, kind: "science" },
  activityLevels: { value: [1.2, 1.375, 1.55, 1.725, 1.9] as const, kind: "science" },
  proteinRange: { value: { min: 1.6, max: 2.2 }, kind: "science" },
  /** Ajustement hebdomadaire. */
  adjustMinDays: { value: 14, kind: "conception" },
  adjustCaps: { value: [50, 100, 150] as const, kind: "conception" },
  /** Pesées. */
  weighInLateDays: { value: 2, kind: "conception" },
  weighInIncompleteDays: { value: 7, kind: "conception" },
  /** Créneaux de repas, heure de début incluse (HH:MM). Le reste = collation. */
  mealSlots: {
    value: [
      { meal: "breakfast", from: "05:00", to: "10:29" },
      { meal: "lunch", from: "10:30", to: "14:29" },
      { meal: "dinner", from: "18:30", to: "22:29" },
    ] as const,
    kind: "conception",
  },
  /** Raccourci de portion : nombre de saisies regardées et seuil d'apparition. */
  portionWindow: { value: 10, kind: "conception" },
  portionMinRepeats: { value: 2, kind: "conception" },
  /** Alerte « Vérifie la quantité ? ». */
  quantityMinHistory: { value: 3, kind: "conception" },
  quantityRatio: { value: 4, kind: "conception" },
  /** Ordre des sources pour passer d'un aliment cru à sa valeur cuite (décision du 02/11). */
  cookedSources: { value: ["product-weighing", "base-weighing", "ciqual-cooked"] as const, kind: "conception" },
} as const;

export type Rules = typeof RULES;
