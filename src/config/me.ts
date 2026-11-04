/** Réglages de l'onglet Moi (bilan de la semaine, top des aliments). */
export const ME = {
  /** Période du top affichée sur Moi et choisie par défaut sur l'écran Top, en jours. */
  topDays: 30,
  /** Périodes proposées sur l'écran Top, en jours (365 = « 1 an »). */
  topPeriods: [7, 30, 365],
  /** Nombre d'aliments du top. */
  topCount: 10,
  /** Nombre d'aliments du top montrés directement sur Moi. */
  homeTopCount: 3,
} as const;
