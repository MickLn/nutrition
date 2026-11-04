"use client";

import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { scannerHref, type AddContext } from "./links";

/** Largeurs des barres du pictogramme « Scanner » du Figma (21:1260), en px. */
const BARS = [2, 1, 3, 1, 2, 1];

/** Carré 44 px à droite de la recherche (Figma 8:154) : ouvre le scanner pour le même jour et le même repas. */
export function ScanButton(ctx: AddContext) {
  const { t } = useT();
  return (
    <Link
      href={scannerHref(ctx)}
      aria-label={t("scanner.open")}
      className="flex size-11 shrink-0 items-center justify-center gap-0.5 rounded-base border border-trait transition-transform active:scale-95"
    >
      {BARS.map((w, i) => (
        <span key={i} aria-hidden className="h-4 bg-texte" style={{ width: w }} />
      ))}
    </Link>
  );
}
