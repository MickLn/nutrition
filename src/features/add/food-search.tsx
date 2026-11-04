"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { UI } from "@/config/ui";
import { loadSearch } from "@/features/foods/catalog";
import type { FoodItem } from "@/features/foods/types";
import { recentFoods } from "@/features/journal/journal";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";

type SearchFn = Awaited<ReturnType<typeof loadSearch>>;

/**
 * Recherche (récents d'abord) avec sélection multiple. Le chevron d'une ligne ouvre la fiche de l'aliment.
 * Sans résultat (Figma 47:1461) : « Créer « … » » ; `noResultActions` accueille une autre action (scanner, Open Food Facts).
 */
export function FoodSearch({ selected, onToggle, noResultActions }: { selected: FoodItem[]; onToggle: (f: FoodItem) => void; noResultActions?: React.ReactNode }) {
  const { t, n, lang } = useT();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchFn | null>(null);
  const [failed, setFailed] = useState(false);
  const recents = useLiveQuery(() => recentFoods(UI.recentsCount), []) ?? [];

  useEffect(() => {
    let alive = true;
    loadSearch(lang)
      .then((s) => alive && setSearch(() => s))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [lang]);

  const q = query.trim();
  const list = q ? (search ? search(q, UI.searchLimit) : []) : recents;
  const ids = new Set(selected.map((s) => s.id));
  const empty = !!q && !!search && list.length === 0;
  // Le repas et la date de la saisie suivent vers la création d'un aliment.
  const createHref = (name: string) => {
    const p = new URLSearchParams(name ? { name } : {});
    for (const k of ["date", "meal"]) if (params.get(k)) p.set(k, params.get(k)!);
    return `/ajouter/aliment/${p.size ? `?${p}` : ""}`;
  };

  return (
    <div>
      {/* Composant « Recherche » du Figma : Geist Mono majuscules, ligne Klein dessous, sans loupe ; le texte tapé est en Outfit. */}
      <label className="flex h-11 items-center border-b-2 border-actif">
        <span className="sr-only">{t("add.search")}</span>
        <input
          type="search"
          enterKeyHint="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("add.search")}
          className="w-full bg-transparent text-corps outline-none placeholder:font-mono placeholder:text-valeur placeholder:uppercase placeholder:tracking-[0.04em] placeholder:text-texte-discret"
        />
      </label>

      {empty ? (
        <div className="mt-[22px] flex flex-col">
          <p className="text-corps">{t("food.none")}</p>
          <div className="mt-5 flex flex-col gap-2.5">
            {noResultActions}
            <Link href={createHref(q)} className={buttonVariants({ variant: "secondary", className: "w-full" })}>
              <span className="min-w-0 [overflow-wrap:anywhere]">{t("food.create-named", { name: q })}</span>
            </Link>
          </div>
        </div>
      ) : (
        <h2 className="libelle mt-[22px]">{q ? t("add.results") : t("add.recents")}</h2>
      )}
      {q && !search && <p className="mt-2 text-petit text-texte-discret">{failed ? t("add.none") : t("add.loading")}</p>}
      <ul className="mt-1.5">
        {list.map((f) => {
          const on = ids.has(f.id);
          return (
            <li key={f.id} className="flex items-center gap-3">
              {/* Composant « Ligne » avec « Case » : case cochée = carré bleu plein, sans coche. */}
              <button
                role="checkbox"
                aria-checked={on}
                aria-label={t("add.select", { name: f.name })}
                onClick={() => onToggle(f)}
                className="flex min-w-0 flex-1 items-center gap-3 py-3.5 text-left"
              >
                <span className={cn("size-[18px] shrink-0 rounded-base", on ? "bg-actif" : "border-[1.5px] border-texte-discret")} aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-corps [overflow-wrap:anywhere]">{f.name}</span>
                  {f.lastGrams !== undefined && <span className="text-petit text-texte-discret">{t("add.last-time", { n: n(f.lastGrams) })}</span>}
                </span>
              </button>
              <Link href={`/aliment/?id=${encodeURIComponent(f.id)}&from=add`} aria-label={t("food.open", { name: f.name })} className="tap shrink-0 px-1 text-corps text-texte-discret">
                ›
              </Link>
            </li>
          );
        })}
      </ul>
      {!empty && (
        <Link href={createHref(q)} className="tap mt-4 inline-block text-petit text-actif underline">
          {t("food.new")}
        </Link>
      )}
    </div>
  );
}
