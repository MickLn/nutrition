import fr from "./fr.json";
import en from "./en.json";

/**
 * Liste des langues. Ajouter une langue = ajouter son fichier JSON et une ligne ici.
 * Le reste du code ne change pas : il passe toujours par t().
 */
export const LANGUAGES = { fr, en } as const;
export const DEFAULT_LANGUAGE: Language = "fr";
export type Language = keyof typeof LANGUAGES;
