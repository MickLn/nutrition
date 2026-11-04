/**
 * Langues dont le fichier de noms CIQUAL existe dans public/data (ciqual-names.<langue>.json).
 * À compléter après `python3 scripts/build-ciqual.py <fichier> <langue>` : évite de demander un fichier absent (erreur 404).
 */
export const CIQUAL_NAME_LANGS: readonly string[] = ["en"];
