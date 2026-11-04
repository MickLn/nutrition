/**
 * Réglages de la brique Bilan de la semaine (Progrès › Bilans). Étiquette « conception » comme dans rules.ts.
 */
export const REVIEW = {
  /** Réglage (table settings) où est rangé l'historique des ajustements automatiques (un par semaine). */
  settingsKey: "kcal-adjustments",
  /** Début de semaine : 1 = lundi (Figma : « Semaine du 6 octobre » est un lundi). */
  weekStartDay: { value: 1, kind: "conception" },
  /** Le bilan d'une semaine apparaît ce nombre de jours après son dernier jour (1 = dès le lundi suivant un dimanche). */
  availableAfterDays: { value: 1, kind: "conception" },
  /** Pesées minimum dans la semaine pour qu'elle ait un bilan. */
  minWeighIns: { value: 4, kind: "conception" },
  /** Nombre de bilans listés dans Progrès. */
  listWeeks: { value: 8, kind: "conception" },
  /**
   * Moyenne hebdomadaire avec tolérance : proposée, jamais validée (etat-projet.md).
   * Désactivée : tant que MickLn ne l'a pas validée, le bilan compare la moyenne à l'objectif sans marge.
   */
  tolerance: { enabled: false, pct: 0.05, kind: "conception" },
} as const;
