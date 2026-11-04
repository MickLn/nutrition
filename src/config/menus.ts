/** Réglages de la brique « Menus » (aliments mangés ensemble, ajoutés en un tap). */
export const MENUS = {
  /** Menus montrés dans l'onglet avant « Voir les N menus ». */
  tabLimit: 5,
  /** Pas des boutons − et + d'un aliment, en g. */
  stepG: 10,
  /** Quantité d'un aliment ajouté sans historique, en g. */
  defaultGrams: 100,
  /** Quantité maximale d'un élément, en g. */
  gramsMax: 2000,
  /** Nombre maximal de parts d'un plat dans un menu. */
  partsMax: 20,
  /** Longueur maximale du nom, en caractères. */
  nameMaxLength: 80,
} as const;
