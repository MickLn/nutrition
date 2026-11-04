"use client";

import { Suspense } from "react";
import { ScannerFlow } from "@/features/scanner/scanner-flow";

/** Ajouter › Scanner un code-barres (Figma 8:415, 8:431, 8:464, 47:1551). */
export default function ScannerPage() {
  return (
    <Suspense>
      <ScannerFlow />
    </Suspense>
  );
}
