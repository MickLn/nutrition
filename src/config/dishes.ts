/** Réglages de la brique « Plats » (recettes et plats en lot). */
export const DISHES = {
  /** Pas des boutons − et + d'un ingrédient, en g. */
  gramsStep: 10,
  /** Poids donné à un ingrédient ajouté au plat, en g. */
  newIngredientG: 100,
  /** Poids accepté pour un ingrédient, une part, le plat cuit entier, en g. */
  ingredientMaxG: 5000,
  partMaxG: 3000,
  cookedMaxG: 20000,
  /** Part « habituelle » tant qu'aucune part n'a été mangée (pour « environ 3 parts »), en g. */
  defaultPartG: 350,
  /** Plats montrés dans l'onglet avant « Voir les N plats ». */
  listLimit: 5,
  /** Jusqu'à combien de jours on écrit le jour (« dimanche ») plutôt que la date. */
  weekdayWithinDays: 6,
  /** « Enregistrer comme recette ? » après une saisie d'au moins ce nombre d'aliments (plat maison pesé ingrédient par ingrédient). */
  offerMinFoods: 2,
} as const;
