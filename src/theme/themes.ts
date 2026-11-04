import { z } from "zod";

/**
 * Couche 1 : palette de marque (primitives).
 * Les composants n'utilisent jamais ces valeurs directement :
 * ils passent par les tokens sémantiques ci-dessous.
 */
export const brand = {
  paper: "#f4f3ef", // Papier
  carbon: "#1a1915", // Carbone
  signal: "#ff6f0f", // Orange Signal
  klein: "#002fa7", // Bleu Klein
  kleinDark: "#638cff", // Bleu Klein en mode sombre
} as const;

/** Couche 2 : tokens sémantiques, mêmes noms que les variables « Couleurs » du Figma. Seuls utilisés par l'UI. */
export const TOKEN_NAMES = [
  "fond",
  "texte",
  "texte-discret",
  "trait",
  "piste",
  "actif",
  "actif-leger",
  "signal",
  "sur-signal",
  "eau",
  "voile",
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];

const tokenSetSchema = z.object(
  Object.fromEntries(TOKEN_NAMES.map((n) => [n, z.string().min(1)])) as Record<TokenName, z.ZodString>,
);

export type TokenSet = z.infer<typeof tokenSetSchema>;

/** Couche 3 : un thème = un jeu de tokens clair + un jeu sombre. */
export const themeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  light: tokenSetSchema,
  dark: tokenSetSchema,
});

export type Theme = z.infer<typeof themeSchema>;

/** Une couleur de la palette avec transparence (règle du 28/10 : jamais de nouveau code couleur). */
const alpha = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;

/** Valeurs relevées dans les variables Figma (04/11). */
export const papierSignal: Theme = {
  id: "papier-signal",
  name: "Papier & Signal",
  light: {
    fond: brand.paper,
    texte: brand.carbon,
    "texte-discret": alpha(brand.carbon, 0.68),
    trait: alpha(brand.carbon, 0.14),
    piste: alpha(brand.carbon, 0.08),
    actif: brand.klein,
    "actif-leger": alpha(brand.klein, 0.12),
    signal: brand.signal,
    "sur-signal": brand.carbon,
    eau: alpha(brand.klein, 0.6),
    voile: alpha(brand.carbon, 0.4),
  },
  dark: {
    fond: brand.carbon,
    texte: brand.paper,
    "texte-discret": alpha(brand.paper, 0.62),
    trait: alpha(brand.paper, 0.14),
    piste: alpha(brand.paper, 0.1),
    actif: brand.kleinDark,
    "actif-leger": alpha(brand.kleinDark, 0.16),
    signal: brand.signal,
    "sur-signal": brand.carbon,
    eau: alpha(brand.kleinDark, 0.6),
    voile: alpha(brand.carbon, 0.6),
  },
};

/** Thèmes proposés dans Réglages > Apparence. En ajouter un suffit à le rendre disponible. */
export const themes: Theme[] = [papierSignal];

export const DEFAULT_THEME_ID = papierSignal.id;

export function findTheme(id: string | undefined): Theme {
  return themes.find((t) => t.id === id) ?? papierSignal;
}

export type ThemeMode = "system" | "light" | "dark";

export const appearanceSchema = z.object({
  themeId: z.string().default(DEFAULT_THEME_ID),
  mode: z.enum(["system", "light", "dark"]).default("system"),
  /** Couleurs personnalisées par-dessus le thème (futur écran de personnalisation). */
  overrides: z
    .object({
      light: tokenSetSchema.partial().default({}),
      dark: tokenSetSchema.partial().default({}),
    })
    .default({ light: {}, dark: {} }),
});

export type Appearance = z.infer<typeof appearanceSchema>;

export const defaultAppearance: Appearance = appearanceSchema.parse({});

/** Clé localStorage lue par le script anti-flash avant le premier rendu. */
export const APPEARANCE_STORAGE_KEY = "nutrition.appearance";
