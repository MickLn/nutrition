/**
 * Réglages des suggestions de protéines (écran « Tap sur la jauge protéines »).
 * Règle (decisions.md) : on part des aliments déjà mangés, avec la quantité qui comble l'écart ;
 * tard le soir, seulement du léger.
 */
export const PROTEIN = {
  /** À partir de cette heure (HH:MM), on ne propose que du léger. */
  lateFrom: "21:00",
  /** Tard le soir : calories maximales d'une part proposée, en kcal. */
  lightKcalMax: 160,
  /** Un aliment est « riche en protéines » à partir de ce nombre de g pour 100 g. */
  minPer100g: 8,
  /** Quantité maximale proposée pour un aliment, en g (au-delà, ce n'est plus une collation). */
  maxPortionG: 200,
  /** Les quantités proposées sont arrondies à ce pas, en g. */
  roundG: 10,
  /** Nombre de suggestions affichées. */
  count: 4,
  /** Nombre de saisies récentes regardées pour trouver des aliments habituels. */
  recentsScan: 40,
  /** Sous ce nombre de suggestions habituelles, on complète avec le catalogue CIQUAL. */
  catalogFillBelow: 3,
  /** Catalogue : densité de protéines acceptée (g pour 100 g) et calories maximales pour 100 g (écarte poudres et viandes grasses). */
  catalog: { minPer100g: 10, maxPer100g: 30, kcalMaxPer100g: 200 },
} as const;
