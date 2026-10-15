/** Ratio de contraste WCAG entre deux couleurs hexadécimales (#rrggbb). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Choisit le texte le plus lisible (encre ou papier) sur une couleur de fond. */
export function readableOn(bg: string, dark = "#1a1915", light = "#f4f3ef"): string {
  return contrastRatio(bg, dark) >= contrastRatio(bg, light) ? dark : light;
}
