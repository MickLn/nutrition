"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FoodSheet, type SheetFrom } from "@/features/food-sheet/food-sheet";
import { gramsParam } from "@/features/food-sheet/sheet";
import { toISODate } from "@/lib/dates";

/** Fiche d'un aliment : /aliment/?id=<id>[&g=<grammes>][&from=journal|add][&meal=…][&date=AAAA-MM-JJ]. */
export default function FoodPage() {
  return (
    <Suspense>
      <FoodRoute />
    </Suspense>
  );
}

function FoodRoute() {
  const params = useSearchParams();
  const from = params.get("from");
  return (
    <FoodSheet
      id={params.get("id") ?? ""}
      date={params.get("date") ?? toISODate(new Date())}
      entryGrams={gramsParam(params.get("g"))}
      from={from === "journal" || from === "add" ? (from as SheetFrom) : null}
      meal={params.get("meal")}
    />
  );
}
