"use client";

import { BookOpen, ChefHat, Plus, Settings, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Journal", icon: BookOpen },
  { href: "/recettes/", label: "Recettes", icon: ChefHat },
  { href: "/ajouter/", label: "Ajouter", icon: Plus, primary: true },
  { href: "/progres/", label: "Progrès", icon: TrendingUp },
  { href: "/reglages/", label: "Réglages", icon: Settings },
];

const normalize = (p: string) => (p.endsWith("/") ? p : `${p}/`);

export function BottomNav() {
  const pathname = normalize(usePathname() ?? "/");
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href;
          if (primary)
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  className="-mt-5 flex size-14 items-center justify-center rounded-full bg-action text-action-fg shadow-[0_6px_20px_-6px_var(--action)] transition-transform active:scale-95"
                >
                  <Icon className="size-7" strokeWidth={2.25} />
                </Link>
              </li>
            );
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-transform active:scale-95",
                  active ? "text-blue" : "text-muted",
                )}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
