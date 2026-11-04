"""Construit src/config/cooked-pairs.json : paires CIQUAL cru -> cuit et rendements de référence.

Usage : python3 scripts/build-cooked-pairs.py <dossier donnees>
  (le dossier du projet qui contient cru-cuit-paires.json, rendements-propositions.json,
   ciqual-cru-cuit.md et ciqual-2025.xlsx ; par défaut /mnt/project-files/nutrition/donnees/)

L'app ne lit jamais ces fichiers : elle lit seulement le JSON généré, rangé dans src/config
(petit, intégré au code, donc disponible hors ligne sans toucher au service worker).

Règles (décisions du 01/11 et du 02/11, « si doute, n'associe pas ») :
  - cru-cuit-paires.json : une paire est gardée si elle est marquée « verifie », ou si sa version
    cuite a passé le contrôle automatique (« ok_auto »). Les « a_revoir » sont écartées.
    Un cru avec plusieurs cuissons possibles (bouilli, vapeur, rôti…) reste sans paire : on ne devine pas.
  - ciqual-cru-cuit.md : table relue à la main (pâtes, riz, lentilles, quinoa, steak haché, poulet),
    ses paires s'ajoutent et passent devant.
  - rendements-propositions.json : seules les liaisons « verifie » sont gardées (rendement cuit / cru).
  - « weighable » : aliments crus (viandes, poissons, féculents, légumes…) sans paire, pour qui seule
    la pesée perso (« Ma pesée ») permet de passer au cuit.
Seuls les codes présents dans public/data/ciqual.json sont gardés.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src/config/cooked-pairs.json"
CIQUAL = ROOT / "public/data/ciqual.json"
CIQUAL_LABEL = "CIQUAL 2025"

# Sous-groupes CIQUAL (anglais) où un aliment cru se cuit avant d'être mangé.
WEIGHABLE_GROUPS = {
    "raw meat", "fish, raw", "seafood, raw", "pasta, rice and grains",
    "potatoes and other tubers", "legumes", "vegetables", "eggs",
}
RAW = re.compile(r"\b(raw|dried|dry|uncooked)\b", re.I)


def json_pairs(path: Path) -> dict[str, str]:
    out = {}
    for p in json.loads(path.read_text())["paires"]:
        usable = p["cuits"] if p.get("verifie") else [c for c in p["cuits"] if c.get("controle") == "ok_auto"]
        if len(usable) == 1:
            out[p["cru"]["code"]] = usable[0]["code"]
    return out


def md_pairs(path: Path) -> dict[str, str]:
    """Lignes « | Pâtes sèches, crues | 9810 | … » : deux lignes de même nom avant la virgule = cru puis cuit."""
    rows = []
    for line in path.read_text().splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) > 2 and cells[1].isdigit():
            rows.append((cells[0].rsplit(",", 1)[0].strip(), cells[1]))
    groups: dict[str, list[str]] = {}
    for name, code in rows:
        groups.setdefault(name, []).append(code)
    return {codes[0]: codes[1] for codes in groups.values() if len(codes) == 2}


def reference_yields(path: Path) -> dict[str, float]:
    return {
        l["ciqual_cru"]["code"]: round(l["usda"]["rendement_pct"] / 100, 4)
        for l in json.loads(path.read_text())["liaisons"]
        if l.get("verifie")
    }


def raw_codes(xlsx: Path) -> list[str]:
    rows = openpyxl.load_workbook(xlsx, read_only=True).active.iter_rows(values_only=True)
    head = [str(h or "").lower() for h in next(rows)]
    c_code, c_name, c_group = head.index("alim_code"), head.index("alim_nom_eng"), head.index("alim_ssgrp_nom_eng")
    return [str(r[c_code]) for r in rows if r[c_group] in WEIGHABLE_GROUPS and RAW.search(str(r[c_name] or ""))]


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/mnt/project-files/nutrition/donnees/")
    known = json.loads(CIQUAL.read_text())["foods"]
    pairs = {**json_pairs(src / "cru-cuit-paires.json"), **md_pairs(src / "ciqual-cru-cuit.md")}
    pairs = {r: c for r, c in sorted(pairs.items(), key=lambda x: int(x[0])) if r in known and c in known}
    yields = {r: y for r, y in reference_yields(src / "rendements-propositions.json").items() if r in known}
    weighable = sorted({c for c in raw_codes(src / "ciqual-2025.xlsx") if c in known and c not in pairs} | set(yields), key=int)
    data = {
        "_note": "Généré par scripts/build-cooked-pairs.py. Ne pas modifier à la main.",
        "ciqual": CIQUAL_LABEL,
        "pairs": pairs,
        "referenceYields": yields,
        "weighable": weighable,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(pairs)} paires, {len(yields)} rendements, {len(weighable)} crus à peser -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
