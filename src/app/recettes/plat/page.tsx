"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/ui/page";
import { DishForm } from "@/features/recipes/dish-form";
import { useDraft } from "@/features/recipes/use-draft";
import { useT } from "@/i18n/use-t";

/**
 * Nouveau plat (Figma 47:1639) : /recettes/plat/. Un seul formulaire, l'interrupteur « Cuisiné en grande quantité »
 * en fait un plat en lot (?lot=1 l'allume au départ). ?id=<plat> modifie un plat ; ?entries=<ids> part des aliments
 * d'une saisie (« Enregistrer comme recette ? ») ; ?name= préremplit le nom.
 */
export default function DishFormPage() {
  return (
    <Suspense>
      <DishFormRoute />
    </Suspense>
  );
}

function DishFormRoute() {
  const { t } = useT();
  const params = useSearchParams();
  const opts = { id: params.get("id"), entries: params.get("entries"), name: params.get("name"), batch: params.get("lot") === "1" };
  const loaded = useDraft(opts);
  if (loaded === undefined) return null;
  if (loaded === null)
    return (
      <div className="flex flex-col">
        <BackLink href="/recettes/">{t("dishes.back-recipes")}</BackLink>
        <p className="mt-3.5 text-corps text-texte-discret">{t("dishes.missing")}</p>
      </div>
    );
  return <DishForm key={opts.id ?? opts.entries ?? "new"} initial={loaded.draft} previous={loaded.previous} />;
}
