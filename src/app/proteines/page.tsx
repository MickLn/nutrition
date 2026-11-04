"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProteinPage } from "@/features/protein/protein-page";
import { toISODate } from "@/lib/dates";

/** Suggestions de protéines : /proteines/?date=AAAA-MM-JJ (le jour du Journal d'où l'on vient). */
export default function ProteinRoute() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const date = useSearchParams().get("date");
  return <ProteinPage date={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : toISODate(new Date())} />;
}
