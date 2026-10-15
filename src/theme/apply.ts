import {
  APPEARANCE_STORAGE_KEY,
  findTheme,
  TOKEN_NAMES,
  type Appearance,
  type TokenSet,
} from "./themes";

export function resolveTokens(appearance: Appearance, dark: boolean): TokenSet {
  const theme = findTheme(appearance.themeId);
  return dark
    ? { ...theme.dark, ...appearance.overrides.dark }
    : { ...theme.light, ...appearance.overrides.light };
}

export function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function isDarkMode(appearance: Appearance): boolean {
  return appearance.mode === "dark" || (appearance.mode === "system" && prefersDark());
}

/** Applique le thème sur <html> et le mémorise pour le script anti-flash. */
export function applyAppearance(appearance: Appearance) {
  const dark = isDarkMode(appearance);
  const tokens = resolveTokens(appearance, dark);
  const root = document.documentElement;
  for (const name of TOKEN_NAMES) root.style.setProperty(`--${name}`, tokens[name]);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--bg").trim());

  try {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({
        mode: appearance.mode,
        light: resolveTokens(appearance, false),
        dark: resolveTokens(appearance, true),
      }),
    );
  } catch {
    // Stockage indisponible (navigation privée) : le thème par défaut du CSS s'applique.
  }
}

/**
 * Script exécuté dans <head> avant le premier rendu : évite le flash
 * du thème par défaut quand l'utilisateur a choisi le mode sombre ou une palette perso.
 */
export const themeBootScript = `(function(){try{
var s=JSON.parse(localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)})||"null");
var m=s&&s.mode||"system";
var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";
var t=s&&(d?s.dark:s.light);if(t){for(var k in t)r.style.setProperty("--"+k,t[k]);}
}catch(e){}})();`;
