"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Row } from "@/components/ui/row";
import { Sheet } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/toast";
import { useBricks } from "@/bricks/use-bricks";
import { useT } from "@/i18n/use-t";
import type { Meal } from "@/lib/db";
import { useCount } from "./menu-parts";
import { addMenuToMeal, sortMenus, type MenuView } from "./menus";
import { useMenus } from "./use-menus";

/**
 * Lien « Menus » d'un repas de l'écran Jour, à côté de « Copier hier » (Figma 91:2073) :
 * le panneau liste les menus, un tap en ajoute un à ce repas (avec « Annuler »).
 */
export function MealMenus({ date, meal }: { date: string; meal: Meal }) {
  const { t } = useT();
  const on = useBricks();
  const [open, setOpen] = useState(false);
  if (!on("menus")) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="tap underline">
        {t("menus.open")}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label={t(`menus.for.${meal}`)}>
        <MenuList date={date} meal={meal} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function MenuList({ date, meal, onDone }: { date: string; meal: Meal; onDone: () => void }) {
  const { t, n } = useT();
  const count = useCount();
  const menus = useMenus();
  const list = sortMenus(menus ?? [], "recent");

  const add = async (m: MenuView) => {
    const { undo } = await addMenuToMeal(m.id, m.items, date, meal);
    onDone();
    showToast(t("menus.added", { name: m.name, to: t(`meals-to.${meal}`) }), { label: t("menus.undo"), run: () => void undo() });
  };

  return (
    <div>
      {/* Mono/Libellé en Klein (la classe « libelle » impose le gris discret). */}
      <h2 className="num text-mono-petit uppercase tracking-[0.08em] text-actif">{t(`menus.for.${meal}`)}</h2>
      {menus && list.length === 0 && <p className="mt-3.5 text-petit text-texte-discret">{t("menus.none")}</p>}
      <ul className="mt-1.5">
        {list.map((m) => (
          <li key={m.id}>
            <Row label={m.name} detail={count(m.items.length)} value={`${n(m.total.kcal)} ${t("units.kcal")}`} onClick={() => add(m)} />
          </li>
        ))}
      </ul>
      <Link href="/recettes/menu/" className={buttonVariants({ variant: "link", className: "mt-3 w-full" })}>
        {t("menus.new")}
      </Link>
    </div>
  );
}
