"use client";

import { ScanBarcode, Search } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Soon } from "@/components/soon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "recent", label: "Récents", phase: 4 },
  { id: "favorites", label: "Favoris", phase: 7 },
  { id: "ciqual", label: "Aliments", phase: 3 },
  { id: "products", label: "Produits", phase: 5 },
  { id: "recipes", label: "Recettes", phase: 6 },
] as const;

type Tab = (typeof TABS)[number];

export default function AddPage() {
  const [tab, setTab] = useState<Tab>(TABS[0]);
  return (
    <>
      <PageHeader title="Ajouter" subtitle="Journal" />

      <div className="flex gap-2">
        <label className="flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-line bg-bg2 px-3">
          <Search className="size-5 text-muted" />
          <span className="sr-only">Rechercher un aliment</span>
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Rechercher un aliment…"
            className="w-full bg-transparent outline-none placeholder:text-muted"
          />
        </label>
        <Button variant="primary" size="icon" className="size-12" aria-label="Scanner un code-barres" disabled>
          <ScanBarcode />
        </Button>
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t)}
            aria-pressed={tab.id === t.id}
            className={cn(
              "min-h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-transform active:scale-95",
              tab.id === t.id ? "border-fg bg-fg text-bg" : "border-line text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="mt-4">
        <EmptyState icon={Search} title={`${tab.label} : bientôt disponible`}>
          <p>Cette liste arrive avec la prochaine étape du développement.</p>
          <div className="mt-3">
            <Soon phase={tab.phase} />
          </div>
        </EmptyState>
      </Card>
    </>
  );
}
