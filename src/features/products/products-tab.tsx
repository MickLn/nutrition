"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Row } from "@/components/ui/row";
import { scannerHref } from "@/features/scanner/links";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import { groupByLetter, listProducts, productName, productPortion, type ProductSort } from "./products";
import type { Food } from "@/lib/db";

const letterId = (l: string) => `produits-${l === "#" ? "autre" : l}`;

/** Onglet Produits de Recettes (Figma 9:779) : produits scannés et aliments perso ; en A à Z, sections par lettre et index à droite. */
export function ProductsTab({ query, sort }: { query: string; sort: ProductSort }) {
  const { t, locale } = useT();
  const foods = useLiveQuery(() => listProducts({ sort, query, locale }), [sort, query, locale]);
  if (!foods) return null;

  if (!foods.length)
    return <p className="mt-[18px] text-petit text-texte-discret">{t(query.trim() ? "products.no-result" : sort === "fav" ? "products.no-favorite" : "products.empty")}</p>;

  if (sort !== "az")
    return (
      <div className="mt-2">
        {foods.map((f) => (
          <ProductRow key={f.id} food={f} />
        ))}
      </div>
    );

  const groups = groupByLetter(foods);
  return (
    <>
      {groups.map((g) => (
        <section key={g.letter} id={letterId(g.letter)} aria-labelledby={`${letterId(g.letter)}-titre`} className="mt-[18px] scroll-mt-6">
          <h3 id={`${letterId(g.letter)}-titre`} className="libelle">
            {g.letter}
          </h3>
          <div className="mt-1.5">
            {g.foods.map((f) => (
              <ProductRow key={f.id} food={f} />
            ))}
          </div>
        </section>
      ))}
      {groups.length > 1 && <LetterIndex letters={groups.map((g) => g.letter)} />}
    </>
  );
}

function ProductRow({ food }: { food: Food }) {
  const { t, n } = useT();
  const { grams, kcal } = productPortion(food);
  return <Row href={`/aliment/?id=${encodeURIComponent(food.id)}`} label={productName(food)} detail={t("products.detail", { g: n(grams), kcal: n(kcal) })} />;
}

/** « Index alphabétique » du Figma : lettres présentes, collées au bord droit ; un tap ou un glissement va à la section. */
function LetterIndex({ letters }: { letters: string[] }) {
  const { t } = useT();
  const go = (l: string | undefined) => l && document.getElementById(letterId(l))?.scrollIntoView({ block: "start" });
  return (
    <nav
      aria-label={t("products.index")}
      className="fixed top-1/2 right-[max(11px,calc((100vw_-_28rem)/2_+_11px))] z-30 flex -translate-y-1/2 touch-none flex-col items-end gap-[3px]"
      onPointerMove={(e) => {
        if (e.buttons === 0 && e.pointerType === "mouse") return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        go(el instanceof HTMLElement ? el.dataset.letter : undefined);
      }}
    >
      {letters.map((l) => (
        <button
          key={l}
          type="button"
          data-letter={l}
          aria-label={t("products.jump", { letter: l })}
          onClick={() => go(l)}
          className="-mr-[11px] pl-4 pr-[11px] font-mono text-mono-petit uppercase tracking-[0.08em] text-texte-discret"
        >
          {l}
        </button>
      ))}
    </nav>
  );
}

/** État vide (Figma 9:893) : un seul bouton principal pour scanner, un lien pour saisir à la main. */
export function ProductsEmpty() {
  const { t } = useT();
  return (
    <div className="mt-[110px] flex flex-col items-stretch">
      <p className="text-center text-petit text-texte-discret">{t("products.empty")}</p>
      <Link href={scannerHref({})} className={cn(buttonVariants({ variant: "primary" }), "mt-5")}>
        {t("products.scan")}
      </Link>
      <Link href="/ajouter/aliment/" className={cn(buttonVariants({ variant: "link" }), "mt-2 self-center")}>
        {t("products.manual")}
      </Link>
    </div>
  );
}
