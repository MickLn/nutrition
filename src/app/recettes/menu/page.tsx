"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MenuEditor } from "@/features/menus/menu-editor";

/** Nouveau menu (`/recettes/menu/`) ou modification (`?id=`). */
export default function MenuEditPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}

function Editor() {
  const id = useSearchParams().get("id");
  return <MenuEditor key={id ?? "new"} id={id} />;
}
