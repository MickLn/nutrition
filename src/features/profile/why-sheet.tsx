"use client";

import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Bloc « Explication » du Figma : ton cas porte une barre bleue à gauche, la valeur est en bleu. */
export type WhyItem = {
  label: React.ReactNode;
  value?: React.ReactNode;
  text: string;
  /** Ton cas (barre bleue). */
  mine?: boolean;
  /** Libellé en Geist Mono (un chiffre, ex. « 68,0 kg »). */
  monoLabel?: boolean;
};

export type WhySection = { title: string; subtitle?: string; item: WhyItem };

export function Explanation({ label, value, text, mine, monoLabel }: WhyItem) {
  return (
    <div className={cn("flex flex-col gap-1.5 py-0.5 pl-[14px]", mine && "border-l-2 border-actif")}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("min-w-0 flex-1 [overflow-wrap:anywhere]", monoLabel ? "num text-valeur" : "text-petit")}>{label}</span>
        {value !== undefined && <span className="num shrink-0 text-valeur text-actif">{value}</span>}
      </div>
      <p className="text-petit text-texte-discret">{text}</p>
    </div>
  );
}

/** Panneau « Pourquoi ? » du Figma : titre, rappel « Tes choix sont en bleu. », puis une explication courte par sujet. */
export function WhySheet({
  open,
  onClose,
  title,
  hint,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  hint: string;
  sections: WhySection[];
}) {
  return (
    <Sheet open={open} onClose={onClose} label={title}>
      <h2 className="mt-2 text-section font-medium">{title}</h2>
      <p className="mt-2 text-petit text-texte-discret">{hint}</p>
      {sections.map((s) => (
        <section key={s.title} className="mt-[26px] pb-2.5">
          <h3 className="text-section font-medium">{s.title}</h3>
          {s.subtitle && <p className="mt-1 text-petit text-texte-discret">{s.subtitle}</p>}
          <div className="mt-2.5">
            <Explanation {...s.item} />
          </div>
        </section>
      ))}
      <div className="h-9" aria-hidden />
    </Sheet>
  );
}
