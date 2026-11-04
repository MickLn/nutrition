import { cn } from "@/lib/utils";

/** « Ligne libre » du Figma : colonnes égales, libellé discret en petit au-dessus, chiffre Geist Mono 20. */
export function MacroColumns({ items }: { items: { label: string; value: string; accent?: boolean }[] }) {
  return (
    <dl className="flex gap-3">
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 flex-1 flex-col gap-0.5">
          <dt className="text-petit text-texte-discret [overflow-wrap:anywhere]">{it.label}</dt>
          <dd className={cn("num whitespace-nowrap text-moyen", it.accent && "text-actif")}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
