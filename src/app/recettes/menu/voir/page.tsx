"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MenuScreen } from "@/features/menus/menu-view";
import { toISODate } from "@/lib/dates";

/** Un menu, ajouté en un tap (`?id=`, et facultativement `&date=` et `&meal=`). */
export default function MenuPage() {
  return (
    <Suspense>
      <Screen />
    </Suspense>
  );
}

function Screen() {
  const params = useSearchParams();
  const id = params.get("id");
  return <MenuScreen key={id} id={id} date={params.get("date") ?? toISODate(new Date())} meal={params.get("meal")} />;
}
