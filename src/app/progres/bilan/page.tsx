"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WeekDetail } from "@/features/review/week-detail";

/** Détail d'un bilan de la semaine : /progres/bilan/?week=AAAA-MM-JJ (premier jour de la semaine). */
function Bilan() {
  return <WeekDetail start={useSearchParams().get("week")} />;
}

export default function WeeklyReviewPage() {
  return (
    <Suspense>
      <Bilan />
    </Suspense>
  );
}
