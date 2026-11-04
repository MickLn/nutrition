/** Composant « Alerte » du Figma : carré Signal 8 px, texte Geist Mono majuscules, jamais de rouge. */
export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p className="num flex gap-2 py-1 text-mono-petit uppercase tracking-[0.08em]">
      <span className="flex h-4 w-2 shrink-0 items-center" aria-hidden>
        <span className="size-2 bg-signal" />
      </span>
      <span>{children}</span>
    </p>
  );
}
