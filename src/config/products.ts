/** Réglages de l'onglet Produits de Recettes. */
export const PRODUCTS = {
  /** Sources listées : produits scannés (Open Food Facts) et aliments perso. Les aliments CIQUAL n'y sont pas. */
  sources: ["off", "custom"],
  /** Étiquette (Food.tags) d'un produit mis en favori : filtre « Favoris ». */
  favoriteTag: "favori",
  /** Tri proposé à l'ouverture de l'onglet (Figma « Produits, A à Z »). */
  defaultSort: "az",
  /** Lettre de section des noms qui ne commencent pas par une lettre (chiffre, symbole). */
  otherLetter: "#",
} as const;
