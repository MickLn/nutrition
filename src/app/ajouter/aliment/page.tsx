"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { draftFromFood, EMPTY_DRAFT } from "@/features/create-food/form";
import { FoodForm } from "@/features/create-food/food-form";
import { useFood } from "@/features/food-sheet/load";
import { useT } from "@/i18n/use-t";

/**
 * Créer un aliment (Figma 8:502) : /ajouter/aliment/[?name=…][&code=<code-barres>][&date=…&meal=…].
 * Avec ?id=<id> : modifie cet aliment perso.
 */
export default function CreateFoodPage() {
  return (
    <Suspense>
      <CreateFood />
    </Suspense>
  );
}

function CreateFood() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const found = useFood(id);
  const { n } = useT();
  const back = () => (window.history.length > 1 ? router.back() : router.push("/ajouter/"));

  if (id) {
    if (!found?.food) return null;
    // Séparateur décimal de la langue (« 3,6 » en français).
    return <FoodForm key={id} initial={draftFromFood(found.food, n(1.5, 1).charAt(1))} previous={found.food} onSaved={back} onCancel={back} />;
  }

  return (
    <FoodForm
      initial={{ ...EMPTY_DRAFT, name: params.get("name") ?? "" }}
      barcode={params.get("code") ?? undefined}
      onCancel={back}
      onSaved={(food) => {
        // Étape suivante de la saisie : peser l'aliment créé, dans le même repas.
        const q = new URLSearchParams({ food: food.id });
        for (const k of ["date", "meal"]) {
          const v = params.get(k);
          if (v) q.set(k, v);
        }
        router.replace(`/ajouter/?${q}`);
      }}
    />
  );
}
