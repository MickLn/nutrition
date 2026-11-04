import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge ne connaît pas nos tailles de texte (globals.css) : sans cette liste, il prend
 * « text-mono-petit » pour une couleur et le supprime dès qu'une couleur « text-actif » suit.
 */
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["page", "section", "corps", "petit", "heros", "grand", "moyen", "valeur", "mono-petit"] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
