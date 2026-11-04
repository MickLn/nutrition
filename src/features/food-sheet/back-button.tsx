"use client";

import { useRouter } from "next/navigation";

/**
 * Composant « Retour » du Figma (« ‹ Journal ») qui revient à l'écran précédent, avec son état (recherche tapée,
 * aliments cochés). Ouvert directement, sans historique : va à `fallback`.
 */
export function BackButton({ children, fallback = "/" }: { children: React.ReactNode; fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="tap self-start text-petit text-actif"
    >
      ‹ {children}
    </button>
  );
}
