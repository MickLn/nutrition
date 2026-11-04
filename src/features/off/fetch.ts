import { OFF } from "@/config/off";
import { offToFood, type Converted, type OffProduct } from "./convert";

/**
 * Résultat d'une recherche sur Open Food Facts.
 * - found : fiche utilisable ;
 * - unknown : code absent de la base, ou fiche sans énergie ;
 * - offline : pas de réseau ;
 * - error : Open Food Facts trop lent ou en panne (le code est gardé, on peut réessayer).
 */
export type OffResult = ({ status: "found" } & Converted) | { status: "unknown" } | { status: "offline" } | { status: "error" };

/** Adresse appelée : seul le code-barres part, avec le nom de l'app et la liste des champs utiles. */
export function productUrl(code: string, lang: string): string {
  const params = new URLSearchParams({ fields: [...OFF.fields, `product_name_${lang}`].join(","), app_name: OFF.appName });
  return `${OFF.productUrl}${encodeURIComponent(code)}.json?${params}`;
}

/** Cherche un produit par son code-barres. Ne lève jamais d'erreur : tout échec devient un statut. */
export async function fetchOffProduct(code: string, lang: string, timeoutMs: number = OFF.timeoutMs): Promise<OffResult> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { status: "offline" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(productUrl(code, lang), { signal: ctrl.signal, credentials: "omit", referrerPolicy: "no-referrer" });
    if (res.status === 404) return { status: "unknown" };
    if (!res.ok) return { status: "error" };
    const body = (await res.json()) as { status?: number; product?: OffProduct };
    if (body.status !== 1 || !body.product) return { status: "unknown" };
    const converted = offToFood(body.product, code, lang);
    return converted ? { status: "found", ...converted } : { status: "unknown" };
  } catch (e) {
    // Délai dépassé : Open Food Facts ne répond pas. Sinon (TypeError de fetch) : réseau coupé.
    if (ctrl.signal.aborted) return { status: "error" };
    return { status: e instanceof TypeError ? "offline" : "error" };
  } finally {
    clearTimeout(timer);
  }
}
