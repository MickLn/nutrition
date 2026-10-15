/** Étiquette des fonctions prévues dans une phase suivante. */
export function Soon({ phase }: { phase: number }) {
  return <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted">Phase {phase}</span>;
}
