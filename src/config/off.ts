/** Réglages de la brique Open Food Facts (base collaborative de produits emballés). */
export const OFF = {
  /** Fiche d'un produit par son code-barres (API v2). */
  productUrl: "https://world.openfoodfacts.org/api/v2/product/",
  /**
   * Nom de l'app envoyé à chaque appel : le navigateur interdit l'en-tête User-Agent,
   * Open Food Facts demande alors ce paramètre pour savoir qui l'appelle.
   */
  appName: "Nutrition",
  /** Champs demandés (le reste de la fiche ne sert pas). `product_name_<langue>` est ajouté à l'appel. */
  fields: [
    "code",
    "product_name",
    "generic_name",
    "brands",
    "quantity",
    "serving_size",
    "serving_quantity",
    "serving_quantity_unit",
    "nutriments",
    "nutriscore_grade",
    "image_front_small_url",
    "image_front_url",
  ],
  /** Délai maximal d'attente de la réponse, en ms. Au-delà : écran « hors ligne », le code est gardé. */
  timeoutMs: 8000,
  /** Conversion de l'énergie quand seule la valeur en kJ est donnée. */
  kjPerKcal: 4.184,
  /** Nutri-Score gardés (« unknown » et « not-applicable » sont ignorés). */
  nutriscoreGrades: ["a", "b", "c", "d", "e"],
} as const;
