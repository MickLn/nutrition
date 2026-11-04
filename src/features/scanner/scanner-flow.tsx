"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SCANNER } from "@/config/scanner";
import { mealFromTime } from "@/engine/entry";
import { nowHHMM } from "@/features/journal/journal";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import type { Meal } from "@/lib/db";
import { addHref, createFoodHref, scannerHref } from "./links";
import { lookupBarcode, type Lookup } from "./lookup";
import { ProductFound } from "./product-found";
import { ProductUnknown } from "./product-unknown";
import { ScannerView } from "./scanner-view";

const MEALS: string[] = ["breakfast", "lunch", "dinner", "snack"];

type Result = { code: string; attempt: number; at: number; lookup: Lookup };

/** Assez de temps depuis la dernière recherche pour en relancer une (évite d'appeler Open Food Facts en boucle). */
const canRetry = (r: Result) => Date.now() - r.at > SCANNER.retryMs;

/**
 * Scanner : le code lu (ou tapé) passe dans l'adresse (?code=…), ce qui garde le retour arrière du téléphone.
 * Produit déjà sur le téléphone → fiche tout de suite ; sinon Open Food Facts ; hors ligne → le code est gardé
 * et la recherche repart dès que le réseau revient.
 */
export function ScannerFlow() {
  const { lang } = useT();
  const params = useSearchParams();
  const code = params.get("code");
  const ctx = { date: params.get("date"), meal: params.get("meal") };
  const date = ctx.date ?? toISODate(new Date());
  const meal = (ctx.meal && MEALS.includes(ctx.meal) ? ctx.meal : mealFromTime(nowHHMM())) as Meal;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    void lookupBarcode(code, lang).then((lookup) => alive && setResult({ code, attempt, at: Date.now(), lookup }));
    return () => {
      alive = false;
    };
  }, [code, lang, attempt]);

  const lookup = result && result.code === code ? result.lookup : null;
  const looking = !!code && (!lookup || result?.attempt !== attempt);
  const pending = !!code && !looking && (lookup?.status === "offline" || lookup?.status === "error");

  // Le réseau revient : on relance la recherche du code gardé.
  useEffect(() => {
    if (!pending) return;
    const retry = () => setAttempt((a) => a + 1);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [pending]);

  // Changement d'adresse sans navigation Next (rien à télécharger) : marche aussi hors ligne.
  const go = (c?: string) => window.history.pushState(null, "", scannerHref(ctx, c));
  const onCode = (c: string) => {
    if (c !== code) return go(c);
    if (pending && result && canRetry(result)) setAttempt((a) => a + 1);
  };

  const back = () => go();
  if (code && !looking && lookup) {
    if (lookup.status === "known" || lookup.status === "found")
      return (
        <ProductFound
          key={code}
          food={lookup.food}
          known={lookup.status === "known"}
          missing={lookup.status === "found" ? lookup.missing : []}
          date={date}
          meal={meal}
          onBack={back}
          doneHref={addHref(ctx)}
        />
      );
    if (lookup.status === "unknown") return <ProductUnknown code={code} onBack={back} createHref={createFoodHref(ctx, code)} />;
  }
  return (
    <ScannerView
      code={code}
      status={!code ? null : looking ? "looking" : lookup?.status === "error" ? "error" : "offline"}
      closeHref={addHref(ctx)}
      createHref={code ? createFoodHref(ctx, code) : null}
      onCode={onCode}
    />
  );
}
