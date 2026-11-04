/** Adresses de la saisie, en gardant le jour et le repas choisis sur l'écran Ajouter. */
export type AddContext = { date?: string | null; meal?: string | null };

const query = (ctx: AddContext, extra: Record<string, string | undefined> = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ date: ctx.date ?? undefined, meal: ctx.meal ?? undefined, ...extra })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const scannerHref = (ctx: AddContext, code?: string) => `/ajouter/scanner/${query(ctx, { code })}`;
export const addHref = (ctx: AddContext) => `/ajouter/${query(ctx)}`;
/** Page « Créer un aliment » (autre brique), préremplie avec le code lu. */
export const createFoodHref = (ctx: AddContext, code: string) => `/ajouter/aliment/${query(ctx, { code })}`;
