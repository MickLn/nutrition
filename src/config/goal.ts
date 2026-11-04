/**
 * Réglages de la brique Objectif (Moi › Réglages › Objectif). Étiquette « science » ou « conception » comme dans rules.ts.
 */
export const GOAL = {
  /** Poids visé refusé sous cet IMC (OMS : insuffisance pondérale sous 18,5). */
  minBmi: { value: 18.5, kind: "science" },
  /** Protéines acceptées à la saisie, en g/kg : minimum ANSES (0,83) et haut de la zone « élevé » (3,5). Hors 1,6 à 2,2, un avertissement s'affiche. */
  proteinInput: { value: { min: 0.8, max: 3.5 }, kind: "science" },
  /** Ajustement max proposé par défaut, en kcal par semaine (decisions.md, 17/10). */
  defaultAdjustCap: { value: 100, kind: "conception" },
  /** Date estimée : « début » avant ce jour du mois, « mi- » avant le suivant, « fin » ensuite. */
  monthPart: { value: { mid: 11, late: 21 }, kind: "conception" },
  /** Calcul de la date estimée : on s'arrête au-delà de ce nombre de semaines. */
  maxWeeks: { value: 520, kind: "conception" },
} as const;
