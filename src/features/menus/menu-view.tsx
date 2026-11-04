"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label, PageTitle } from "@/components/ui/page";
import { showToast } from "@/components/ui/toast";
import { mealFromTime } from "@/engine/entry";
import { BackButton } from "@/features/food-sheet/back-button";
import { nowHHMM } from "@/features/journal/journal";
import { useT } from "@/i18n/use-t";
import type { Meal } from "@/lib/db";
import { cn } from "@/lib/utils";
import { MENUS_TAB_HREF } from "./menu-editor";
import { ItemList, ItemPicker, MenuNumbers } from "./menu-parts";
import { addMenuToMeal, itemsTotal, mergeItems, type MenuView, type Resolved } from "./menus";
import { useMenu } from "./use-menus";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

/**
 * « Menu, ajout en un tap » (Figma 9:607) : le menu, ses quantités corrigeables pour cette fois
 * (le menu enregistré ne change pas), et l'ajout au repas déduit de l'heure.
 */
export function MenuScreen({ id, date, meal }: { id: string | null; date: string; meal: string | null }) {
  const { t } = useT();
  const menu = useMenu(id);
  if (!menu)
    return (
      <div className="flex flex-col">
        <BackButton fallback={MENUS_TAB_HREF}>{t("menus.back")}</BackButton>
        <p className="mt-3.5 text-corps text-texte-discret">{t(menu === null ? "menus.missing" : "menus.loading")}</p>
      </div>
    );
  return <MenuAdd key={`${menu.id}:${menu.updatedAt}`} menu={menu} date={date} meal={meal && MEALS.includes(meal as Meal) ? (meal as Meal) : null} />;
}

function MenuAdd({ menu, date, meal: asked }: { menu: MenuView; date: string; meal: Meal | null }) {
  const { t } = useT();
  const router = useRouter();
  const [meal] = useState<Meal>(() => asked ?? mealFromTime(nowHHMM()));
  const [items, setItems] = useState<Resolved[]>(menu.items);
  const [picking, setPicking] = useState(false);
  const to = t(`meals-to.${meal}`);

  const add = async () => {
    const { undo } = await addMenuToMeal(menu.id, items, date, meal);
    showToast(t("menus.added", { name: menu.name, to }), { label: t("menus.undo"), run: () => void undo() });
    router.push("/");
  };

  return (
    <div className="flex flex-col">
      <BackButton fallback={MENUS_TAB_HREF}>{t("menus.back")}</BackButton>
      <PageTitle className="mt-3.5">{menu.name}</PageTitle>
      <p className="libelle mt-1.5">{t("menus.label")}</p>

      <MenuNumbers total={itemsTotal(items)} />

      <Label className="mt-[22px]">{t("menus.items-title")}</Label>
      <div className="mt-1.5">
        <ItemList items={items} setItems={setItems} />
      </div>
      <button type="button" onClick={() => setPicking(true)} className="tap mt-1 self-start text-petit text-actif underline">
        {t("menus.add-item")}
      </button>

      <div className="mt-8 flex items-center gap-3">
        <Button className="min-w-0 flex-1" disabled={!items.length} onClick={add}>
          {t("menus.add-to", { to })}
        </Button>
        {/* « Modifier (picto) » : crayon dans un carré de 52 px. */}
        <Link
          href={`/recettes/menu/?id=${encodeURIComponent(menu.id)}`}
          aria-label={t("menus.edit")}
          className={cn(buttonVariants({ variant: "secondary" }), "size-[52px] shrink-0 px-0")}
        >
          <Pencil className="size-[18px]" strokeWidth={1.5} aria-hidden />
        </Link>
      </div>

      <ItemPicker open={picking} onClose={() => setPicking(false)} onAdd={(added) => setItems((xs) => mergeItems(xs, added))} />
    </div>
  );
}
