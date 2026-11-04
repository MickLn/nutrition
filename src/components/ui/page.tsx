import Link from "next/link";
import { cn } from "@/lib/utils";

/** Composant « Retour » du Figma : lien bleu en haut à gauche, « ‹ Moi ». */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="tap self-start text-petit text-actif">
      ‹ {children}
    </Link>
  );
}

/** Style « Titre/Page » : Outfit Medium 32. */
export function PageTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cn("text-page font-medium tracking-[-0.02em] [overflow-wrap:anywhere]", className)}>{children}</h1>;
}

/** Composant « Tête de section » : titre 20 Medium, lien « Pourquoi ? » facultatif à droite. */
export function SectionHead({ children, why, onWhy }: { children: React.ReactNode; why?: string; onWhy?: () => void }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-section font-medium">{children}</h2>
      {why && onWhy && (
        <button onClick={onWhy} className="tap shrink-0 text-petit text-texte-discret">
          {why}
        </button>
      )}
    </div>
  );
}

/** Style « Mono/Libellé » utilisé comme titre de bloc (CETTE SEMAINE, TOI…). */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("libelle", className)}>{children}</h2>;
}
