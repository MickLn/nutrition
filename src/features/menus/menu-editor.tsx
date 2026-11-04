"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label, PageTitle } from "@/components/ui/page";
import { showToast } from "@/components/ui/toast";
import { MENUS } from "@/config/menus";
import { Field } from "@/features/create-food/field";
import { BackButton } from "@/features/food-sheet/back-button";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import { ItemList, ItemPicker, MenuNumbers } from "./menu-parts";
import { deleteMenu, itemsTotal, mergeItems, saveMenu, type MenuView, type Resolved } from "./menus";
import { useMenu } from "./use-menus";

/** Retour à l'onglet Menus de Recettes. */
export const MENUS_TAB_HREF = "/recettes/?onglet=menus";

/** « Nouveau menu » (Figma 47:1569), ou modification d'un menu existant (`id`). */
export function MenuEditor({ id }: { id: string | null }) {
  const { t } = useT();
  const menu = useMenu(id);
  if (id && !menu)
    return (
      <div className="flex flex-col">
        <BackButton fallback={MENUS_TAB_HREF}>{t("menus.back")}</BackButton>
        <p className="mt-3.5 text-corps text-texte-discret">{t(menu === null ? "menus.missing" : "menus.loading")}</p>
      </div>
    );
  // Le brouillon démarre une fois le menu lu : il ne suit plus la base ensuite.
  return <EditorForm key={menu?.id ?? "new"} initial={menu ?? null} />;
}

function EditorForm({ initial }: { initial: MenuView | null }) {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [items, setItems] = useState<Resolved[]>(initial?.items ?? []);
  const [favorite, setFavorite] = useState(!!initial?.favorite);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const ready = !!name.trim() && items.length > 0 && !saving;

  const leave = () => (window.history.length > 1 ? router.back() : router.push(MENUS_TAB_HREF));

  const save = async () => {
    setSaving(true);
    try {
      await saveMenu({ id: initial?.id, name, items, favorite });
      showToast(t("menus.saved"));
      leave();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!initial) return;
    const undo = await deleteMenu(initial.id);
    router.push(MENUS_TAB_HREF);
    showToast(t("menus.deleted"), { label: t("menus.undo"), run: () => void undo() });
  };

  return (
    <div className="flex flex-col">
      <BackButton fallback={MENUS_TAB_HREF}>{t("menus.back")}</BackButton>
      <PageTitle className="mt-3.5">{t(initial ? "menus.title-edit" : "menus.title-new")}</PageTitle>
      <Field className="mt-1.5" label={t("menus.name")} value={name} onChange={(v) => setName(v.slice(0, MENUS.nameMaxLength))} placeholder={t("menus.name-placeholder")} />

      <MenuNumbers total={itemsTotal(items)} />

      <Label className="mt-[22px]">{t("menus.items-title")}</Label>
      <div className="mt-1.5">
        <ItemList items={items} setItems={setItems} />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 text-petit text-actif">
        <button type="button" onClick={() => setPicking(true)} className="tap underline">
          {t("menus.add-item")}
        </button>
        {initial && (
          <button type="button" onClick={remove} className="tap underline">
            {t("menus.delete")}
          </button>
        )}
      </div>

      <div className="mt-8 flex items-center gap-2.5">
        <Button className="min-w-0 flex-1" disabled={!ready} onClick={save}>
          {t("menus.save")}
        </Button>
        {/* Bouton carré « Favori » (style de l'étoile de la fiche aliment, Figma 7:424). */}
        <button
          type="button"
          aria-pressed={favorite}
          aria-label={t(favorite ? "menus.favorite-remove" : "menus.favorite-add")}
          onClick={() => setFavorite(!favorite)}
          className={cn(buttonVariants({ variant: "secondary" }), "size-[52px] shrink-0 px-0")}
        >
          <Star className={cn("size-[18px]", favorite && "fill-actif text-actif")} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <ItemPicker open={picking} onClose={() => setPicking(false)} onAdd={(added) => setItems((xs) => mergeItems(xs, added))} />
    </div>
  );
}
