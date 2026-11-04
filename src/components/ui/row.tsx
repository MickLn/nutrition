import Link from "next/link";
import { cn } from "@/lib/utils";

type RowProps = {
  label: React.ReactNode;
  /** Détail en petit sous le libellé (jamais de point médian). */
  detail?: React.ReactNode;
  /** Valeur Geist Mono alignée à droite. */
  value?: React.ReactNode;
  /** Chevron « › » à droite (ligne qui mène ailleurs). */
  chevron?: boolean;
  /** Case à gauche (choix unique ou multiple) : true = carré bleu plein. */
  checked?: boolean;
  href?: string;
  onClick?: () => void;
  /** Espacement vertical : 14 px (défaut) ou 10 px (listes de choix serrées). */
  dense?: boolean;
  className?: string;
};

/** Composant « Ligne » du Figma. Toute la ligne est cliquable quand elle a une action. */
export function Row({ label, detail, value, chevron, checked, href, onClick, dense, className }: RowProps) {
  const inner = (
    <>
      {checked !== undefined && (
        <span aria-hidden className={cn("size-[18px] shrink-0 rounded-base", checked ? "bg-actif" : "border-[1.5px] border-texte-discret")} />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-corps [overflow-wrap:anywhere]">{label}</span>
        {detail && <span className="text-petit text-texte-discret [overflow-wrap:anywhere]">{detail}</span>}
      </span>
      {(value !== undefined || chevron) && (
        <span className="flex shrink-0 items-center gap-2 text-texte-discret">
          {value !== undefined && <span className="num text-valeur">{value}</span>}
          {chevron && <span className="text-corps" aria-hidden>›</span>}
        </span>
      )}
    </>
  );
  const cls = cn("flex w-full items-center gap-3 text-left", dense ? "min-h-11 py-2.5" : "py-3.5", className);
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  if (onClick)
    return (
      <button onClick={onClick} className={cls} role={checked !== undefined ? "radio" : undefined} aria-checked={checked}>
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
}
