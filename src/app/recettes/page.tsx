"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FilterGroup } from "@/components/ui/filter";
import { PageTitle } from "@/components/ui/page";
import { Sheet } from "@/components/ui/sheet";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { PRODUCTS } from "@/config/products";
import { MenusTab } from "@/features/menus/menus-tab";
import { countProducts, type ProductSort } from "@/features/products/products";
import { ProductsEmpty, ProductsTab } from "@/features/products/products-tab";
import { DishesTab } from "@/features/recipes/dishes-tab";
import { useT } from "@/i18n/use-t";

/** Onglets de Recettes, dans l'ordre du Figma ; la valeur est celle du paramètre d'URL `?onglet=`. */
const TABS = ["plats", "menus", "produits"] as const;
type Tab = (typeof TABS)[number];
const DEFAULT_TAB: Tab = "plats";
const SORTS: ProductSort[] = ["recent", "az", "fav"];
const START_SORT: Record<Tab, ProductSort> = { plats: "recent", menus: "recent", produits: PRODUCTS.defaultSort };
const ID = "recettes";

/** Choix du panneau « + Ajouter » (Figma 21:1377). « Un plat en lot » est masqué dans le Figma : le formulaire de plat a son interrupteur. */
const ADD_CHOICES = [
  { key: "dish", href: "/recettes/plat/" },
  { key: "menu", href: "/recettes/menu/" },
] as const;

/** Recettes (Figma 9:366, 86:2146, 9:779) : titre, onglets Plats / Menus / Produits, recherche et filtres. L'onglet est gardé dans l'URL. */
export default function RecipesPage() {
  return (
    <Suspense>
      <Recipes />
    </Suspense>
  );
}

function Recipes() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const asked = params.get("onglet");
  const tab: Tab = TABS.includes(asked as Tab) ? (asked as Tab) : DEFAULT_TAB;
  const [query, setQuery] = useState("");
  const [sorts, setSorts] = useState(START_SORT);
  const [adding, setAdding] = useState(false);
  const productCount = useLiveQuery(countProducts, []);
  const sort = sorts[tab];

  // replace : changer d'onglet n'ajoute pas d'étape à l'historique, mais le retour depuis une fiche revient sur cet onglet.
  const setTab = (next: Tab) => router.replace(next === DEFAULT_TAB ? pathname : `${pathname}?onglet=${next}`, { scroll: false });
  const productsEmpty = tab === "produits" && productCount === 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <PageTitle>{t("recipes.title")}</PageTitle>
        {/* Figma : le lien « + Ajouter » n'apparaît pas sur l'onglet Produits (on y ajoute en scannant). */}
        {tab !== "produits" && (
          <button type="button" onClick={() => setAdding(true)} className="tap shrink-0 text-corps text-actif underline">
            <span aria-hidden>+ </span>
            {t("recipes.add")}
          </button>
        )}
      </div>

      <div className="mt-3.5">
        <Tabs<Tab> idPrefix={ID} label={t("recipes.tabs-label")} value={tab} onChange={setTab} options={TABS.map((v) => ({ value: v, label: t(`recipes.tabs.${v}`) }))} />
      </div>

      <TabPanel idPrefix={ID} value={tab}>
        {productsEmpty ? (
          <ProductsEmpty />
        ) : (
          <>
            {/* Composant « Recherche » du Figma : Geist Mono majuscules, ligne Klein dessous, sans loupe ; le texte tapé est en Outfit. */}
            <label className="mt-3 flex h-11 items-center border-b-2 border-actif">
              <span className="sr-only">{t(tab === "produits" ? "recipes.search-products" : "recipes.search")}</span>
              <input
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(tab === "produits" ? "recipes.search-products" : "recipes.search")}
                className="w-full min-w-0 bg-transparent text-corps outline-none placeholder:font-mono placeholder:text-valeur placeholder:uppercase placeholder:tracking-[0.04em] placeholder:text-texte-discret"
              />
            </label>
            <div className="mt-3 flex">
              <FilterGroup<ProductSort>
                label={t("recipes.sort-label")}
                value={sort}
                onChange={(s) => setSorts((all) => ({ ...all, [tab]: s }))}
                options={SORTS.map((s) => ({ value: s, label: t(`recipes.sort.${s}`) }))}
              />
            </div>
            {tab === "plats" && <DishesTab query={query} sort={sort} />}
            {tab === "menus" && <MenusTab query={query} sort={sort} />}
            {tab === "produits" && <ProductsTab query={query} sort={sort} />}
          </>
        )}
      </TabPanel>

      <Sheet open={adding} onClose={() => setAdding(false)} label={t("recipes.add-sheet.title")}>
        <h2 className="text-section font-medium">{t("recipes.add-sheet.title")}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {ADD_CHOICES.map((c) => (
            <li key={c.key}>
              <Link href={c.href} className="flex flex-col gap-1 rounded-base border border-trait px-[14px] py-3 transition-transform active:scale-[0.99]">
                <span className="text-corps font-medium [overflow-wrap:anywhere]">{t(`recipes.add-sheet.${c.key}`)}</span>
                <span className="text-petit text-texte-discret [overflow-wrap:anywhere]">{t(`recipes.add-sheet.${c.key}-detail`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
