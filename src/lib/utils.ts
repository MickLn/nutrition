import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge ne connaît pas nos tailles de texte (globals.css) : sans cette déclaration, il prend
 * « text-petit » pour une couleur et l'efface devant « text-actif ».
 */
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["page", "section", "corps", "petit", "heros", "grand", "moyen", "valeur", "mono-petit"] }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
