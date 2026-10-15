import { z } from "zod";

/**
 * Couche 1 : palette de marque (primitives).
 * Les composants n'utilisent jamais ces valeurs directement :
 * ils passent par les tokens sémantiques ci-dessous.
 */
export const brand = {
  paper: "#f4f3ef", // Papier Coton
  carbon: "#1a1915", // Encre Ardoise
  signal: "#ff6f0f", // Orange Signal
  klein: "#002fa7", // Bleu Klein
  azur: "#6b8bff", // Azur Brumeux
} as const;

/** Couche 2 : tokens sémantiques, seuls utilisés par l'UI. */
export const TOKEN_NAMES = [
  "bg",
  "bg2",
  "fg",
  "muted",
  "blue",
  "line",
  "action",
  "action-fg",
  "chart-kcal",
  "chart-protein",
  "chart-carbs",
  "chart-fat",
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];

const tokenSetSchema = z.object(
  Object.fromEntries(TOKEN_NAMES.map((n) => [n, z.string().min(1)])) as Record<
    TokenName,
    z.ZodString
  >,
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

export const papierSignal: Theme = {
  id: "papier-signal",
  name: "Papier & Signal",
  light: {
    bg: brand.paper,
    bg2: `color-mix(in srgb, ${brand.carbon} 5%, ${brand.paper})`,
    fg: brand.carbon,
    muted: "#5b5a56",
    blue: brand.klein,
    line: "rgb(26 25 21 / 0.14)",
    action: brand.signal,
    "action-fg": brand.carbon,
    "chart-kcal": brand.signal,
    "chart-protein": brand.klein,
    "chart-carbs": brand.azur,
    "chart-fat": "#8a8780",
  },
  dark: {
    bg: brand.carbon,
    bg2: `color-mix(in srgb, ${brand.paper} 5%, ${brand.carbon})`,
    fg: brand.paper,
    muted: "#9d9c98",
    blue: brand.azur,
    line: "rgb(244 243 239 / 0.12)",
    action: brand.signal,
    "action-fg": brand.carbon,
    "chart-kcal": brand.signal,
    "chart-protein": brand.azur,
    "chart-carbs": "#b7c6ff",
    "chart-fat": "#9d9c98",
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
