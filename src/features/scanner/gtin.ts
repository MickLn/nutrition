import { SCANNER } from "@/config/scanner";

/** Garde les chiffres d'un code tapé à la main (espaces, tirets et points retirés). */
export const cleanCode = (raw: string) => raw.replace(/[\s.-]/g, "");

/**
 * Code-barres valable : chiffres seulement, longueur connue, et dernier chiffre de contrôle juste
 * (calcul GS1 : poids 3 et 1 en alternance en partant de la droite). Évite d'envoyer une faute de frappe.
 */
export function isValidGtin(code: string): boolean {
  if (!/^\d+$/.test(code) || !(SCANNER.lengths as readonly number[]).includes(code.length)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
