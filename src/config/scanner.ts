/** Réglages du scanner de code-barres. */
export const SCANNER = {
  /** Codes lus : ceux des produits alimentaires (EAN-13, EAN-8, UPC). */
  formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
  /** Longueurs acceptées pour un code saisi à la main (GTIN-8, UPC-A, EAN-13, GTIN-14). */
  lengths: [8, 12, 13, 14],
  /** Temps entre deux analyses de l'image de la caméra, en ms. */
  intervalMs: 200,
  /** Fichier du lecteur (WebAssembly) servi par l'app elle-même : la lecture marche sans réseau. */
  wasmUrl: "/zxing/zxing_reader.wasm",
  /** Écran « hors ligne » : relire le même code relance la recherche, au plus une fois par cette durée (ms). */
  retryMs: 5000,
  /** Résolution demandée à la caméra (largeur idéale, en px). */
  idealWidth: 1280,
} as const;
