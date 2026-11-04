"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WeighPart } from "@/features/recipes/weigh-part";

/** Peser une part (Figma 9:563, 57:1823) : /recettes/part/?id=<plat>[&date=AAAA-MM-JJ][&meal=lunch]. */
export default function PartRoute() {
  return (
    <Suspense>
      <Part />
    </Suspense>
  );
}

function Part() {
  const params = useSearchParams();
  const id = params.get("id");
  return id ? <WeighPart id={id} date={params.get("date")} meal={params.get("meal")} /> : null;
}
