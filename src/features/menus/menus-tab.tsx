"use client";

import Link from "next/link";
import { useState } from "react";
import { Row } from "@/components/ui/row";
import { MENUS } from "@/config/menus";
import { useT } from "@/i18n/use-t";
import { useCount } from "./menu-parts";
import { sortMenus, type SortMode } from "./menus";
import { useMenus } from "./use-menus";

export const menuHref = (id: string) => `/recettes/menu/voir/?id=${encodeURIComponent(id)}`;

/**
 * Onglet « Menus » de Recettes (Figma 86:2146, liste sous la recherche et les filtres de la page) :
 * un tap ouvre le menu, prêt à être ajouté. `query` et `sort` viennent de la page.
 */
/** Props passées par la page Recettes : texte de la recherche du haut et filtre choisi (Récents, A à Z, Favoris). */
export type MenusTabProps = { query: string; sort: SortMode };

export function MenusTab({ query, sort }: MenusTabProps) {
  const { t, n, locale } = useT();
  const count = useCount();
  const menus = useMenus();
  const [all, setAll] = useState(false);
  if (!menus) return null;

  const q = query.trim();
  const list = sortMenus(menus, sort, q, locale);
  const shown = all || q ? list : list.slice(0, MENUS.tabLimit);
  const empty = menus.length === 0 ? t("menus.empty") : list.length === 0 ? (q ? t("menus.no-match", { q }) : t("menus.no-favorites")) : null;

  return (
    <div className="mt-2">
      <ul>
        {shown.map((m) => (
          <li key={m.id}>
            <Row href={menuHref(m.id)} label={m.name} detail={count(m.items.length, m.total.kcal)} />
          </li>
        ))}
      </ul>
      {empty && <p className="mt-3.5 text-petit text-texte-discret [overflow-wrap:anywhere]">{empty}</p>}
      {menus.length === 0 && (
        <Link href="/recettes/menu/" className="tap mt-4 inline-block text-petit text-actif underline">
          {t("menus.new")}
        </Link>
      )}
      {list.length > shown.length && (
        <button type="button" onClick={() => setAll(true)} className="tap mt-[14px] text-petit text-actif underline">
          {t("menus.see-all", { n: n(list.length) })}
        </button>
      )}
    </div>
  );
}
