#!/usr/bin/env python3
"""Genera los textos en inglés de la web a partir de los CSV en español.

Uso:  python tools/web_en.py [--data web-react/public/data]

Lee   catalog.csv, glossary.csv y pib_sectores.csv
Crea  catalog_en.csv     id,label,descripcion,lectura,fuente,nota_calculo,aviso
      glossary_en.csv    id,term,short,long,example
      pib_sectores_en.csv  rama_id,rama,rama_corta

Los textos del catálogo son cadenas largas y repetitivas («Salario medio · España · todos», descripciones
con el territorio y el sexo metidos en una frase…). El script los trata así:
  1. La etiqueta se parte por « · » y cada trozo se traduce (web_en_parts.py).
  2. En el resto de textos, el territorio, el sexo, la medida y los trozos de la etiqueta se sustituyen
     por {0}, {1}… y la plantilla resultante se busca en web_en_templates.py. Los trozos se traducen igual
     que en la etiqueta, así que se llaman igual en toda la web.
  3. Las fuentes (web_en_data.FUENTES) llevan {T}, {C} y {S} para el número de tabla, el código y la serie.
Si algo no está traducido, el script lo lista todo junto y termina con error: nunca deja español sin avisar.
Se ejecuta solo al final de build_web_data.py, y también se puede lanzar suelto.
"""
import argparse
import csv
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from web_en_data import FUENTES, GLOSARIO, SECTORES  # noqa: E402
from web_en_parts import translate_part  # noqa: E402
from web_en_templates import TEMPLATES  # noqa: E402

CAT_EN_COLS = ["id", "label", "descripcion", "lectura", "fuente", "nota_calculo", "aviso"]
TEXT_FIELDS = ["descripcion", "lectura", "aviso", "nota_calculo"]
# Valores que se cuelan en las frases aunque la etiqueta de la serie no los lleve.
ALWAYS = ["Comunidad de Madrid", "Banco de España"]


def tokens(row):
    ts = {p for p in row["label"].split(" · ") if len(p) >= 3}
    for k in ("territorio", "sexo", "medida"):
        if len(row[k]) >= 3:
            ts.add(row[k])
    ts.update(ALWAYS)
    return sorted(ts, key=lambda s: -len(s))


def tokenize(text, row):
    """Devuelve (plantilla con {0}, {1}…, valores encontrados en orden de aparición)."""
    if not text:
        return text, []
    pat = re.compile(r"(?<![\wÀ-ÿ])(" + "|".join(re.escape(t) for t in tokens(row)) + r")(?![\wÀ-ÿ])")
    found = []

    def sub(m):
        found.append(m.group(1))
        return "{%d}" % (len(found) - 1)

    return pat.sub(sub, text), found


# Plantillas con números dentro (bandas de SMI, niveles de 2022): se resuelven con una expresión regular.
def _smi(m):
    tiempo = "full-time " if m.group(1) else ""
    return f"% of {tiempo}workers with pay {m.group(2)} SMI (minimum wage multiples). " + "{0}, {1}."


def _nivel2022(m):
    unidad = {"mes": "month", "m² y mes": "m² per month"}[m.group(2)]
    pond = " calculated as a weighted average of 17 regions" if m.group(3) else ""
    return (f"2022 level (€{m.group(1)}/{unidad}, SERPAVI){pond} × IPVA flat index for that year "
            "÷ IPVA flat index for 2022 (INE, base 2015 = 100).")


REGEX_TEMPLATES = [
    (re.compile(r"^% trabajadores( a tiempo completo)? con salario (\S+) SMI\. \{0\}, \{1\}\.$"), _smi),
    (re.compile(r"^Nivel de 2022 \(([\d.]+) €/(mes|m² y mes), SERPAVI\)( calculado como media ponderada de 17 CCAA)? × "
                r"índice IPVA de pisos de ese año ÷ índice IPVA de pisos de 2022 \(INE, base 2015 = 100\)\.$"), _nivel2022),
]


class Errores:
    def __init__(self):
        self.parts, self.templates, self.fuentes, self.otros = set(), {}, set(), []

    def __bool__(self):
        return bool(self.parts or self.templates or self.fuentes or self.otros)

    def informe(self):
        out = []
        for p in sorted(self.parts):
            out.append(f"  trozo sin traducir (web_en_parts.PARTS): {p!r}")
        for t, ids in self.templates.items():
            out.append(f"  plantilla sin traducir (web_en_templates.TEMPLATES), p. ej. en «{ids[0]}»:\n    {t!r}")
        for f in sorted(self.fuentes):
            out.append(f"  fuente sin traducir (web_en_data.FUENTES): {f!r}")
        out.extend(f"  {o}" for o in self.otros)
        return "\n".join(out)


def part(p, err):
    try:
        return translate_part(p)
    except KeyError:
        err.parts.add(p)
        return p


def label_en(label, err):
    return " · ".join(part(p, err) for p in label.split(" · "))


def text_en(text, row, err):
    if not text:
        return ""
    tmpl, found = tokenize(text, row)
    en = TEMPLATES.get(tmpl)
    if en is None:
        for rx, fn in REGEX_TEMPLATES:
            m = rx.match(tmpl)
            if m:
                en = fn(m)
                break
    if en is None:
        err.templates.setdefault(tmpl, []).append(row["id"])
        return text
    usados = {int(i) for i in re.findall(r"\{(\d+)\}", en)}
    if not usados <= set(range(len(found))):
        err.otros.append(f"la plantilla inglesa usa un marcador que el español no tiene: {en!r}")
        return text
    return re.sub(r"\{(\d+)\}", lambda m: part(found[int(m.group(1))], err), en)


def fuente_en(f, err):
    if not f:
        return ""
    vals = {}

    def keep(tag, rx):
        def sub(m):
            vals.setdefault(tag, m.group(2))
            return m.group(1) + "{" + tag + "}"
        return lambda s: re.sub(rx, sub, s, count=1)

    norm = f
    for tag, rx in (("C", r"(código )(\w+)"), ("S", r"(serie )(\w+)"), ("T", r"(tabla )(\d+)")):
        norm = keep(tag, rx)(norm)
    en = FUENTES.get(norm)
    if en is None:
        err.fuentes.add(norm)
        return f
    for tag, v in vals.items():
        en = en.replace("{" + tag + "}", v)
    return en


def write(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)


def read(path):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def write_all(data_dir):
    """Crea los tres CSV en inglés junto a los originales. Devuelve (nº de series, términos, ramas)."""
    err = Errores()
    catalog = read(os.path.join(data_dir, "catalog.csv"))
    out = []
    for r in catalog:
        out.append([
            r["id"], label_en(r["label"], err),
            text_en(r["descripcion"], r, err), text_en(r["lectura"], r, err), fuente_en(r["fuente"], err),
            text_en(r["nota_calculo"], r, err), text_en(r["aviso"], r, err),
        ])
    glos = read(os.path.join(data_dir, "glossary.csv"))
    glos_out = []
    for g in glos:
        if g["id"] not in GLOSARIO:
            err.otros.append(f"término del glosario sin traducir (web_en_data.GLOSARIO): {g['id']!r}")
            continue
        term, short, long_, example = GLOSARIO[g["id"]]
        if g["term"].endswith("*") != term.endswith("*"):
            err.otros.append(f"el asterisco del término {g['id']!r} no coincide con el español")
        if bool(g["example"]) != bool(example):
            err.otros.append(f"el ejemplo del término {g['id']!r} está vacío en un idioma y en el otro no")
        glos_out.append([g["id"], term, short, long_, example])
    sect = read(os.path.join(data_dir, "pib_sectores.csv"))
    sect_out = []
    for s in sect:
        if s["rama_id"] not in SECTORES:
            err.otros.append(f"rama del PIB sin traducir (web_en_data.SECTORES): {s['rama_id']!r}")
            continue
        sect_out.append([s["rama_id"], *SECTORES[s["rama_id"]]])
    extra = (set(GLOSARIO) - {g["id"] for g in glos}) | (set(SECTORES) - {s["rama_id"] for s in sect})
    if extra:
        err.otros.append(f"traducciones que ya no se usan: {sorted(extra)}")
    if err:
        print("Faltan traducciones al inglés:\n" + err.informe(), file=sys.stderr)
        sys.exit(1)
    write(os.path.join(data_dir, "catalog_en.csv"), CAT_EN_COLS, out)
    write(os.path.join(data_dir, "glossary_en.csv"), ["id", "term", "short", "long", "example"], glos_out)
    write(os.path.join(data_dir, "pib_sectores_en.csv"), ["rama_id", "rama", "rama_corta"], sect_out)
    return len(out), len(glos_out), len(sect_out)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=os.path.join(os.path.dirname(here), "web-react", "public", "data"))
    a = ap.parse_args()
    n, g, s = write_all(a.data)
    print(f"inglés: series={n} glosario={g} ramas={s} -> {a.data}")
