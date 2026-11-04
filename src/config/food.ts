/**
 * Réglages des briques « Créer un aliment » et « Fiche d'un aliment ».
 * Les valeurs d'un aliment sont saisies pour 100 g.
 */
export const FOOD = {
  /** Longueur maximale du nom et de la marque, en caractères. */
  nameMaxLength: 80,
  brandMaxLength: 60,
  /** Calories pour 100 g : l'huile, l'aliment le plus calorique, fait environ 900 kcal. */
  kcalMax: 900,
  /** Un nutriment ne peut pas dépasser 100 g pour 100 g. */
  gramsMax: 100,
  /** Protéines + glucides + lipides + fibres : 100 g au plus, avec 2 g de marge pour les arrondis des étiquettes. */
  macroSumMaxG: 102,
  /** Poids d'une portion, en g. */
  portionMaxG: 2000,
  /** Fibres : 2 kcal par gramme (règlement UE 1169/2011). Les autres facteurs sont dans RULES.kcalPerG. */
  fiberKcalPerG: 2,
  /** Alerte douce « calories loin des macros » : écart de plus de 15 % ET de plus de 20 kcal. */
  kcalTolerance: { pct: 0.15, kcal: 20 },
  /** Quantité toujours proposée sur la fiche (valeurs pour 100 g), et quantité par défaut sans historique. */
  referenceGrams: 100,
  /**
   * « Pour varier, macros proches » (decisions.md : même famille CIQUAL, sans IA).
   * La table livrée n'a pas les familles : un aliment proche a des macros proches (distance en g pour 100 g sur
   * protéines, glucides, lipides et fibres) et des calories proches ; il doit être plus riche en protéines ou moins calorique.
   * Un mot commun dans le début du nom (avant la première virgule) le fait passer devant, comme une même famille.
   */
  vary: {
    count: 3,
    maxDistanceG: 10,
    maxKcalRatio: 0.2,
    minProteinGainG: 0.5,
    minKcalSave: 5,
    sameWordBonusG: 4,
    minWordLength: 3,
    /** Groupes CIQUAL écartés (premiers chiffres d'un code à 5 chiffres) : 11 = aides culinaires, épices. */
    excludedGroups: ["11"],
  },
} as const;
