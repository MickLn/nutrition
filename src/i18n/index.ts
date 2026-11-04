import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from "./languages";

type Dict = { [k: string]: string | Dict };

/** Texte visible d'après sa clé (« adjust.floor »), avec remplacement de {variables}. Repli sur le français, puis sur la clé. */
export function t(key: string, vars: Record<string, string | number> = {}, lang: Language = DEFAULT_LANGUAGE): string {
  const find = (d: Dict): string | undefined => {
    // Les clés d'erreur contiennent un point (« batch.cooked-weight-missing ») : on essaie d'abord la clé entière sous le premier niveau.
    const [head, ...rest] = key.split(".");
    const node = d[head];
    if (typeof node === "object" && typeof node[rest.join(".")] === "string") return node[rest.join(".")] as string;
    let cur: string | Dict | undefined = d;
    for (const part of key.split(".")) cur = typeof cur === "object" ? cur[part] : undefined;
    return typeof cur === "string" ? cur : undefined;
  };
  const text = find(LANGUAGES[lang] as Dict) ?? find(LANGUAGES[DEFAULT_LANGUAGE] as Dict) ?? key;
  return text.replace(/\{(\w+)\}/g, (_, v) => String(vars[v] ?? `{${v}}`));
}
