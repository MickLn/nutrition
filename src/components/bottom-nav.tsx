"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";

/** Composant « Barre du bas » du Figma : onglets en texte, onglet actif sur pastille bleu léger, + carré orange 44 px. */
const items = [
  { href: "/", label: "nav.journal" },
  { href: "/recettes/", label: "nav.recipes" },
  { href: "/ajouter/", label: "nav.add", primary: true },
  { href: "/progres/", label: "nav.progress" },
  { href: "/moi/", label: "nav.me" },
];

const normalize = (p: string) => (p.endsWith("/") ? p : `${p}/`);

export function BottomNav() {
  const pathname = normalize(usePathname() ?? "/");
  const { t } = useT();
  // Les écrans de saisie ont leur propre bouton en bas : la barre se cache.
  if (pathname.startsWith("/ajouter/") || pathname.startsWith("/bienvenue/")) return null;
  return (
    <nav aria-label={t("nav.main")} className="fixed inset-x-0 bottom-0 z-40 bg-fond pb-[max(env(safe-area-inset-bottom),16px)] pt-[11px]">
      <ul className="mx-auto flex max-w-md items-center px-[14px]">
        {items.map(({ href, label, primary }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex flex-1 justify-center">
              {primary ? (
                <Link
                  href={href}
                  aria-label={t(label)}
                  className="grid size-11 place-items-center rounded-base bg-signal text-[30px] font-light leading-none text-sur-signal transition-transform active:scale-95"
                >
                  <span aria-hidden>+</span>
                </Link>
              ) : (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="grid min-h-11 place-items-center"
                >
                  <span className={cn("rounded-base px-2 py-1.5 text-petit", active ? "bg-actif-leger text-actif" : "text-texte-discret")}>{t(label)}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
