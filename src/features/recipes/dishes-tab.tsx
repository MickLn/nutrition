"use client";

/** Props passées par la page Recettes : texte de la recherche du haut et filtre choisi (Récents, A à Z, Favoris). */
export type DishesTabProps = { query: string; sort: "recent" | "az" | "fav" };

/** Onglet « Plats » de Recettes (brique recipes). Remplacé par la mission Plats. */
export function DishesTab(props: DishesTabProps) {
  void props;
  return null;
}
