import { cn } from "@/lib/utils";

/** Composant « Puce » du Figma : portion rapide ou filtre. Choisie = fond bleu léger + texte bleu Medium, sans trait. */
export function Chip({ selected, className, ...props }: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "tap num shrink-0 rounded-base px-2.5 py-1.5 text-valeur transition-transform active:scale-95",
        selected ? "bg-actif-leger font-medium text-actif" : "text-texte-discret",
        className,
      )}
      {...props}
    />
  );
}
