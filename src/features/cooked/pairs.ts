import { z } from "zod";
import data from "@/config/cooked-pairs.json";

/**
 * Paires CIQUAL cru → cuit et rendements de référence, générés par scripts/build-cooked-pairs.py
 * dans src/config/cooked-pairs.json (seules les paires validées y sont).
 * Ici, tout est converti en ids de l'app (« ciqual:9810 »).
 */
const FileSchema = z.object({
  ciqual: z.string(),
  pairs: z.record(z.string(), z.string()),
  referenceYields: z.record(z.string(), z.number().positive()),
  weighable: z.array(z.string()),
});

export type CookedPairs = {
  /** Nom de la table d'où viennent les valeurs cuites (« CIQUAL 2025 »). */
  label: string;
  /** Id de la version cuite validée d'un aliment cru, s'il y en a une. */
  cookedOf: (rawId: string) => string | undefined;
  /** Aliment cru sans version cuite : seule la pesée perso permet de le peser cuit. */
  isWeighable: (rawId: string) => boolean;
  /**
   * Rendement publié (USDA), validé. Gardé dans les données mais pas utilisé pour convertir :
   * l'ordre du 02/11 (RULES.cookedSources) ne contient pas de table de rendement.
   */
  referenceYield: (rawId: string) => number | undefined;
};

const PREFIX = "ciqual:";
export const ciqualId = (code: string) => `${PREFIX}${code}`;
const codeOf = (id: string) => (id.startsWith(PREFIX) ? id.slice(PREFIX.length) : undefined);

/** Lit le fichier de paires ; lève une erreur s'il est mal formé. */
export function loadPairs(file: unknown): CookedPairs {
  const f = FileSchema.parse(file);
  const weighable = new Set(f.weighable);
  return {
    label: f.ciqual,
    cookedOf: (id) => {
      const c = codeOf(id);
      return c && f.pairs[c] ? ciqualId(f.pairs[c]) : undefined;
    },
    isWeighable: (id) => {
      const c = codeOf(id);
      return !!c && weighable.has(c);
    },
    referenceYield: (id) => {
      const c = codeOf(id);
      return c ? f.referenceYields[c] : undefined;
    },
  };
}

export const PAIRS = loadPairs(data);
