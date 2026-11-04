import { showToast } from "@/components/ui/toast";
import { DISHES } from "@/config/dishes";
import type { LogEntry } from "@/lib/db";
import { sameFoods } from "./dish";
import { allDishes } from "./store";

/**
 * « Après un plat maison » (Figma 8:353, decisions.md : après la première saisie, l'app propose d'enregistrer le plat
 * comme recette, rien n'est enregistré sans accord). Une saisie de plusieurs aliments pesés ensemble est un plat maison :
 * un message propose « Enregistrer comme recette ? », « Oui » ouvre « Nouveau plat » avec ces aliments et ces poids.
 * Rien n'est proposé si un plat a déjà exactement ces aliments.
 */
export async function offerSaveAsDish(rows: LogEntry[], opts: { t: (k: string, v?: Record<string, string | number>) => string; open: (href: string) => void }) {
  const foods = rows.filter((r) => r.refType === "food");
  if (foods.length < DISHES.offerMinFoods) return;
  const ids = foods.map((r) => r.refId);
  if ((await allDishes()).some((d) => sameFoods(d, ids))) return;
  const href = `/recettes/plat/?${new URLSearchParams({ entries: foods.map((r) => r.id).join(",") })}`;
  showToast(opts.t("dishes.offer", { names: foods.map((r) => r.name).join(", ") }), { label: opts.t("dishes.offer-yes"), run: () => opts.open(href) });
}
