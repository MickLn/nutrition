"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { DishPage } from "@/features/recipes/dish-page";

/**
 * Page d'un plat : /recettes/lot/?id=<plat> (Figma 9:457 « Plat en lot », 47:1713 « plat terminé »).
 * Ce n'est pas un formulaire : un plat en lot se crée avec « Nouveau plat » et son interrupteur. Sans id, on y renvoie.
 */
export default function DishRoute() {
  return (
    <Suspense>
      <Dish />
    </Suspense>
  );
}

function Dish() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  useEffect(() => {
    if (!id) router.replace("/recettes/plat/?lot=1");
  }, [id, router]);
  return id ? <DishPage id={id} /> : null;
}
