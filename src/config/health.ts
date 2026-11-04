/** Réglages de l'import des pesées depuis Apple Santé (via un Raccourci iPhone). */
export const HEALTH = {
  /** Page qui reçoit les pesées. Les valeurs sont dans le fragment `#`, jamais envoyé au serveur. */
  path: "/sante/",
  /** Nombre maximal de pesées acceptées dans un seul lien. */
  maxBatch: 31,
  /** Les pesées plus vieilles que ce nombre de jours sont refusées (faute de frappe probable). */
  maxAgeDays: 400,
} as const;
