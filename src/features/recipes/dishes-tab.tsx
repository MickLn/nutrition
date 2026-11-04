"use client";

import Link from "next/link";
import { useState } from "react";
import { Row } from "@/components/ui/row";
import { DISHES } from "@/config/dishes";
import { useT } from "@/i18n/use-t";
import type { Recipe } from "@/lib/db";
import { filterDishes, refWeight, remainingOf, type DishSort } from "./dish";
import { useDishes } from "./use-dishes";
import { useWhen } from "./when";

/** Props passées par la page Recettes : texte de la recherche du haut et filtre choisi (Récents, A à Z, Favoris). */
export type DishesTabProps = { query: string; sort: DishSort };

/** Page d'un plat : un plat en lot ou un plat classique s'ouvrent sur la même page (Figma 9:457). */
export const dishHref = (r: Pick<Recipe, "id">) => `/recettes/lot/?id=${encodeURIComponent(r.id)}`;

/**
 * Onglet « Plats » de Recettes (Figma 9:366) : plats et plats en lot. Un plat en lot montre ce qui reste,
 * un plat classique son poids. Sans recherche, les premiers plats seulement, puis « Voir les N plats ».
 */
export function DishesTab({ query, sort }: DishesTabProps) {
  const { t, n, locale } = useT();
  const { when } = useWhen();
  const all = useDishes();
  const [expanded, setExpanded] = useState(false);
  if (!all) return null;
  const list = filterDishes(all, query, sort, locale);

  if (!list.length)
    return (
      <div className="mt-[18px] flex flex-col items-start gap-2">
        <p className="text-petit text-texte-discret">{t(query.trim() ? "dishes.none" : sort === "fav" ? "dishes.no-favorite" : "dishes.empty")}</p>
        {!query.trim() && sort !== "fav" && (
          <Link href="/recettes/plat/" className="tap text-petit text-actif underline">
            {t("dishes.create")}
          </Link>
        )}
      </div>
    );

  const cut = !query.trim() && !expanded && list.length > DISHES.listLimit;
  const shown = cut ? list.slice(0, DISHES.listLimit) : list;
  const detail = (r: Recipe) => {
    const left = remainingOf(r);
    if (left === null) return t("dishes.list-weight", { g: n(refWeight(r)) });
    if (r.finishedAt) return t("dishes.finished-on", { when: when(new Date(r.finishedAt)) });
    return r.cookedAt ? t("dishes.list-left", { g: n(left), when: when(new Date(r.cookedAt)) }) : t("dishes.list-left-only", { g: n(left) });
  };

  return (
    <div className="mt-2">
      {shown.map((r) => (
        <Row key={r.id} href={dishHref(r)} label={r.name} detail={detail(r)} />
      ))}
      {cut && (
        <button onClick={() => setExpanded(true)} className="tap mt-3.5 text-petit text-actif underline">
          {t("dishes.see-all", { n: n(list.length) })}
        </button>
      )}
    </div>
  );
}
