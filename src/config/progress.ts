/** Réglages de la page Progrès (périodes de la courbe, forme des graphiques, bornes de saisie). */
export const PROGRESS = {
  /** Périodes du sélecteur, en jours (null = depuis la première mesure). */
  periods: [
    { id: "month", days: 30 },
    { id: "months", days: 61 },
    { id: "all", days: null },
  ] as const,
  defaultPeriod: "months",
  /** Tour de taille accepté à la saisie, en cm. */
  waistCm: { min: 40, max: 250 },
  /** Valeurs proposées à la première saisie. */
  defaultWeightKg: 70,
  defaultWaistCm: 85,
  /** Graphiques : hauteur du cadre, zone des points (haut et bas), hauteur des repères du bas, nombre max de graduations, rayon des points. */
  weightChart: { height: 120, top: 4, bottom: 86, labelY: 106, maxTicks: 4, dotR: 1.5 },
  waistChart: { height: 76, top: 10, bottom: 44, labelY: 62, maxTicks: 2, dotR: 2.5 },
  /** « mesuré jeudi » : au-delà de ce nombre de jours, on affiche la date. */
  recentDays: 7,
  /** Marge à gauche et à droite de la zone des points, en px. */
  chartPad: { left: 4, right: 6 },
  /** Largeur de la colonne des graduations, en px. */
  axisWidth: 24,
  /** Pas de graduation essayés, du plus fin au plus large. */
  tickSteps: [0.5, 1, 2, 5, 10, 20] as readonly number[],
  /** Écart minimal entre deux repères de mois sous la courbe, en px. */
  monthLabelGap: 48,
  /** Largeur de départ avant mesure du cadre, en px. */
  chartWidthFallback: 322,
} as const;

export type PeriodId = (typeof PROGRESS.periods)[number]["id"];
