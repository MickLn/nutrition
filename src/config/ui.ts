/** Réglages d'interface (pas des règles de calcul : celles-ci sont dans rules.ts). */
export const UI = {
  /** Doses proposées dans le panneau Eau, en ml. */
  waterDoses: [150, 250, 330, 500],
  /** Dose ajoutée par le lien « +250 » de l'écran du jour, en ml. */
  waterQuickMl: 250,
  /** Un carré de la jauge Eau = un verre de cette taille, en ml. */
  waterGlassMl: 250,
  /** Durée d'affichage d'un message avec « Annuler », en ms. */
  toastMs: 5000,
  /** Nombre d'aliments récents proposés avant toute recherche. */
  recentsCount: 12,
  /** Nombre de résultats de recherche affichés. */
  searchLimit: 30,
  /** Poids accepté à la saisie, en kg (évite une faute de frappe). */
  weightKg: { min: 25, max: 350 },
} as const;
