"use client";

/** Props passées par la page Recettes : texte de la recherche du haut et filtre choisi (Récents, A à Z, Favoris). */
export type MenusTabProps = { query: string; sort: "recent" | "az" | "fav" };

/** Onglet « Menus » de Recettes (brique menus). Remplacé par la mission Menus. */
export function MenusTab(props: MenusTabProps) {
  void props;
  return null;
}
