/** Réglages de la copie vers Notion (sens unique : l'app envoie, elle ne lit jamais Notion). */
export const NOTION = {
  /** Route du serveur (Vercel) qui parle à Notion. */
  endpoint: "/api/notion/",
  /** Une synchronisation toutes les N minutes tant que l'app est ouverte. */
  syncEveryMinutes: 15,
  /** Éléments envoyés par appel (le serveur en accepte au plus autant). */
  batchSize: 10,
  /** Après ce nombre de jours d'échec, une ligne discrète apparaît dans Réglages. */
  staleAfterDays: 3,
  /** Attente maximale d'une réponse du serveur, en ms. */
  requestTimeoutMs: 60_000,
  /** Taille maximale d'une requête acceptée par le serveur, en octets. */
  maxBodyBytes: 200_000,
  /** Limites de taille des données reçues. */
  maxText: 300,
  maxListItems: 100,
  maxRichText: 1900,
  /** Pause entre deux appels à Notion (limite d'environ 3 par seconde), en ms. */
  requestGapMs: 340,
  apiVersion: "2022-06-28",
  defaultApiUrl: "https://api.notion.com/v1",
  /** Bases créées sous la page « Nutrition » de Notion. */
  databases: { food: "Aliments et produits", recipe: "Plats", menu: "Menus" },
  /** Noms des colonnes Notion. */
  columns: {
    title: "Nom",
    appId: "ID app",
    updated: "Mis à jour",
    source: "Source",
    brand: "Marque",
    barcode: "Code-barres",
    kcal: "Calories pour 100 g",
    protein: "Protéines pour 100 g",
    carbs: "Glucides pour 100 g",
    fat: "Lipides pour 100 g",
    fiber: "Fibres pour 100 g",
    type: "Type",
    servings: "Portions",
    cookedWeight: "Poids cuit (g)",
    ingredients: "Ingrédients",
    content: "Contenu",
  },
  /** Valeurs affichées dans les colonnes à choix. */
  sourceLabels: { custom: "Fait main", off: "Produit scanné" },
  typeLabels: { recipe: "Plat", batch: "Plat en lot" },
} as const;
