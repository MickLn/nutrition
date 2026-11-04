"""Convertit la table CIQUAL (xlsx de l'ANSES) en fichiers JSON légers pour l'app.

Usage : python3 scripts/build-ciqual.py <ciqual.xlsx> <langue>
  - écrit public/data/ciqual.json (valeurs pour 100 g, communes à toutes les langues)
  - écrit public/data/ciqual-names.<langue>.json (noms des aliments dans cette langue)
Lancer une fois par fichier de langue (version anglaise, version française…),
puis ajouter la langue dans src/config/catalog.ts (CIQUAL_NAME_LANGS) et dans la liste PAGES de public/sw.js.

Valeurs : « - » (non mesuré), « traces » et « < x » (sous le seuil de mesure) deviennent 0.
Source : ANSES, table CIQUAL 2025, Licence ouverte Etalab (voir assets/credits.md du projet).
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

COLUMNS = {  # repère dans l'en-tête (en minuscules, sans retours à la ligne) -> clé courte
    "kcal": ("energy, regulation", "kcal", "énergie, règlement"),
    "protein": ("protein (g", "protéines, n x facteur de jones"),
    "carbs": ("carbohydrate (g", "glucides (g"),
    "fat": ("fat (g", "lipides (g"),
    "fiber": ("fibres (g",),
    "sugars": ("sugars (g", "sucres (g"),
    "salt": ("salt (g", "sel chlorure de sodium (g"),
}


def num(v):
    if v is None:
        return 0
    s = str(v).strip().replace(",", ".")
    if s in ("-", "") or s.startswith("<") or s.lower() == "traces":
        return 0
    try:
        return round(float(s), 2)
    except ValueError:
        return 0


def main(path: str, lang: str):
    ws = openpyxl.load_workbook(path, read_only=True).worksheets[0]
    rows = ws.iter_rows(values_only=True)
    head = [re.sub(r"\s+", " ", str(h or "")).lower() for h in next(rows)]
    code_i = next(i for i, h in enumerate(head) if h == "alim_code")
    name_i = next(i for i, h in enumerate(head) if h.startswith("alim_nom_") and not h.endswith("sci"))
    idx = {}
    for key, marks in COLUMNS.items():
        for i, h in enumerate(head):
            if any(h.startswith(m) or m in h for m in marks) and key not in idx:
                # Énergie : la colonne en kcal suit celle en kJ.
                idx[key] = i + 1 if key == "kcal" else i
    values, names = {}, {}
    for r in rows:
        if r[code_i] is None:
            continue
        code = str(r[code_i]).strip()
        names[code] = str(r[name_i]).strip()
        values[code] = [num(r[idx[k]]) for k in COLUMNS]
    out = Path(__file__).resolve().parent.parent / "public" / "data"
    out.mkdir(parents=True, exist_ok=True)
    (out / "ciqual.json").write_text(
        json.dumps({"fields": list(COLUMNS), "foods": values}, separators=(",", ":"), ensure_ascii=False)
    )
    (out / f"ciqual-names.{lang}.json").write_text(json.dumps(names, separators=(",", ":"), ensure_ascii=False))
    print(f"{len(values)} aliments, colonnes {idx}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
