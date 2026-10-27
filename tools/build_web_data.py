#!/usr/bin/env python3
"""Convierte los Excel y CSV de la carpeta de datos en los CSV que lee la web.

Uso:  python tools/build_web_data.py [--root RUTA_DE_LOS_EXCEL] [--out web-react/public/data]

Entradas (en --root):
  02_Salarios.xlsx          hojas EES_Distribucion, SMI_Historico, EES_Edad, EES_Sector_Ocup_Contrato, EES_Desigualdad_SMI
  03_Coste_de_la_Vida.xlsx  hojas IPC_General_Anual, HICP_Espana_Grupos, EPF_Nacional/Madrid_2018_2023, ECV_Renta_Pobreza
  01_Empleo_Desempleo.xlsx  hojas EPA_Paro_Anual_SexoEdad, EPA_Tasas_Anual_Calc
  04_Vivienda_y_Alquiler.xlsx  hojas IPV_Anual, Alquiler_IPVA
  05_Poblacion.xlsx         hoja Historico_1971_2026
  datos_web/pib_espana_anual.csv, pib_agregados_2023_2025.csv, educacion_gasto_publico_serie.csv
  datos_web/pib_sectores_vab_2024_2025.csv (se copia a pib_sectores.csv)

Salidas (en --out), todas CSV UTF-8:
  series.csv    id,year,value                 (formato largo)
  catalog.csv   metadatos de cada serie       (texto, unidad, fuente, si es cálculo nuestro...)
  glossary.csv  definiciones para los tooltips
  pib_sectores.csv  copia literal del reparto del PIB por ramas (INE) para el gráfico de queso
  sim/*.csv     copia literal de los CSV de datos_web que usa el simulador (nómina, sanidad, educación…)
  catalog_en.csv, glossary_en.csv, pib_sectores_en.csv  textos en inglés, generados al final con tools/web_en.py

Ningún valor se modifica: las series se copian tal cual de la fuente.
Los cálculos (índices, salario real...) los hace la web y se marcan con *.
"""
import argparse, csv, os, sys
import openpyxl

ap = argparse.ArgumentParser()
here = os.path.dirname(os.path.abspath(__file__))
ap.add_argument("--root", default=os.path.dirname(here))
ap.add_argument("--out", default=None)
args = ap.parse_args()
ROOT = args.root
OUT = args.out or os.path.join(os.path.dirname(here), "web-react", "public", "data")
os.makedirs(OUT, exist_ok=True)

series_rows = []   # (id, year, value)
catalog = []       # dict por serie

CAT_COLS = ["id", "label", "group", "unit", "kind", "territorio", "sexo", "medida", "glosario_id",
            "descripcion", "lectura", "fuente", "origen", "calculado", "nota_calculo",
            "interp", "aviso", "deflactor", "primer_anio", "ultimo_anio"]


def add(id_, label, group, unit, kind, points, *, territorio="", sexo="", medida="", glosario_id="",
        descripcion="", lectura="", fuente="", origen="", calculado=0, nota_calculo="", interp="generic",
        aviso="", deflactor=""):
    pts = [(int(y), float(v)) for y, v in points if v is not None]
    assert pts, id_
    for y, v in pts:
        series_rows.append((id_, y, repr(round(v, 10)) if isinstance(v, float) else v))
    ys = [y for y, _ in pts]
    catalog.append(dict(id=id_, label=label, group=group, unit=unit, kind=kind, territorio=territorio, sexo=sexo,
                        medida=medida, glosario_id=glosario_id, descripcion=descripcion, lectura=lectura,
                        fuente=fuente, origen=origen, calculado=calculado, nota_calculo=nota_calculo,
                        interp=interp, aviso=aviso, deflactor=deflactor, primer_anio=min(ys), ultimo_anio=max(ys)))


# ------------------------------------------------------------------ SALARIOS
wb = openpyxl.load_workbook(os.path.join(ROOT, "02_Salarios.xlsx"), data_only=True)
ws = wb["EES_Distribucion"]
hdr = [c.value for c in ws[1]]
years = [int(h) for h in hdr[4:]]
MED = {
    "Media": ("media", "Salario medio", "media",
              "Suma de todos los salarios brutos anuales dividida entre el número de asalariados.",
              "Los sueldos muy altos la empujan al alza, por eso casi siempre es mayor que la mediana."),
    "Percentil 10": ("p10", "Salario P10", "percentil",
                     "Salario por debajo del cual está el 10 % de los asalariados.",
                     "Describe la parte baja de la escala: nueve de cada diez cobran más."),
    "Cuartil inferior": ("q1", "Salario P25", "cuartil",
                         "Salario por debajo del cual está el 25 % de los asalariados.",
                         "Tres de cada cuatro asalariados cobran más que esta cifra."),
    "Mediana": ("mediana", "Salario mediano", "mediana",
                "Salario del trabajador «de en medio»: la mitad cobra menos y la otra mitad más.",
                "Es la mejor aproximación al sueldo «típico»; la media la suele superar."),
    "Cuartil superior": ("q3", "Salario P75", "cuartil",
                         "Salario por debajo del cual está el 75 % de los asalariados.",
                         "Solo uno de cada cuatro asalariados cobra más que esta cifra."),
    "Percentil 90": ("p90", "Salario P90", "percentil",
                     "Salario por debajo del cual está el 90 % de los asalariados.",
                     "Solo uno de cada diez cobra más: marca la entrada a los salarios altos."),
}
SEXO = {"Ambos sexos": ("t", "todos"), "Mujeres": ("m", "mujeres"), "Hombres": ("h", "hombres")}
TERR = {"Total Nacional": ("es", "España"), "Comunidad de Madrid": ("mad", "Madrid")}
for r in ws.iter_rows(min_row=2, values_only=True):
    cod, sexo, terr, medida = r[:4]
    mk, mlabel, gl, desc, lect = MED[medida]
    sk, slabel = SEXO[sexo]
    tk, tlabel = TERR[terr]
    add(f"sal_{mk}_{tk}_{sk}", f"{mlabel} · {tlabel} · {slabel}", "Salarios brutos anuales (INE)", "eur", "level",
        zip(years, r[4:]), territorio=tlabel, sexo=slabel, medida=mlabel, glosario_id=gl,
        descripcion=f"{desc} Euros brutos al año por trabajador asalariado ({tlabel}, {slabel}).",
        lectura=lect, fuente="INE · Encuesta Anual de Estructura Salarial (EES/EAES), tabla 28191, código " + cod,
        origen="02_Salarios.xlsx › EES_Distribucion", interp="wage",
        aviso="Es la ganancia bruta anual por trabajador: no equivale a un salario por hora ni de jornada completa.",
        deflactor="ipc_es" if tk == "es" else "ipc_mad")

ws = wb["SMI_Historico"]
smi = [(r[0], r[2]) for r in ws.iter_rows(min_row=2, values_only=True) if isinstance(r[0], int) and r[2] is not None]
add("smi_anual", "Salario mínimo (SMI) · anual", "Salario mínimo", "eur", "level", smi, territorio="España",
    glosario_id="smi",
    descripcion="Salario mínimo interprofesional fijado por el Gobierno, en euros brutos al año (mensualidad × 14 pagas).",
    lectura="Es el suelo legal para una jornada completa. Compáralo con la mediana para ver cuánto se acerca el suelo al sueldo típico.",
    fuente="BOE (reales decretos anuales del SMI)", origen="02_Salarios.xlsx › SMI_Historico", interp="wage",
    aviso="Las cifras de 2004 a 2017 vienen de memoria y no están contrastadas con el BOE; 2018–2026 sí.",
    deflactor="ipc_es")

# ------------------------------------------------------------------ IPC
wb2 = openpyxl.load_workbook(os.path.join(ROOT, "03_Coste_de_la_Vida.xlsx"), data_only=True)
ws = wb2["IPC_General_Anual"]
rows = [r for r in ws.iter_rows(min_row=2, values_only=True) if isinstance(r[0], int)]
for col, id_, label, terr in ((1, "ipc_es", "IPC · España", "España"), (2, "ipc_mad", "IPC · Madrid", "Madrid")):
    add(id_, label, "Precios · IPC (INE)", "pct", "rate", [(r[0], r[col]) for r in rows], territorio=terr,
        glosario_id="ipc_dicdic",
        descripcion=f"Cuánto subieron los precios de los bienes y servicios que consumen las familias ({terr}), medido de diciembre a diciembre.",
        lectura="Un +3 % significa que la misma cesta de la compra cuesta un 3 % más que hace un año. Un valor negativo es deflación.",
        fuente="INE · Índice de Precios de Consumo, base 2025 (serie " + ("IPC290750" if terr == "España" else "IPC294331") + ")",
        origen="03_Coste_de_la_Vida.xlsx › IPC_General_Anual", interp="inflation",
        aviso="Mide diciembre sobre diciembre, no la media del año: comparado con un salario medio anual es una aproximación.")

ws = wb2["HICP_Espana_Grupos"]
rows = list(ws.iter_rows(values_only=True))
hdr = rows[0]
hy = [int(h) for h in hdr[2:] if str(h).isdigit()]
for r in rows[1:]:
    if not (r[0] and str(r[0]).startswith("CP")):
        continue
    code, name = r[0], r[1]
    pts = list(zip(hy, r[2:2 + len(hy)]))
    add(f"ipca_{code.lower()}", f"IPCA · {name}", "Precios por grupo (IPCA, España)", "pct", "rate", pts,
        territorio="España", glosario_id="ipca",
        descripcion=f"Variación media anual de los precios del grupo «{name}» en España, con la metodología armonizada europea (IPCA).",
        lectura="Sirve para ver qué parte de la cesta tira de la inflación: alimentos y vivienda pesan mucho en el gasto de las familias.",
        fuente="Eurostat · prc_hicp_aind (IPC armonizado, tasa media anual)",
        origen="03_Coste_de_la_Vida.xlsx › HICP_Espana_Grupos", interp="inflation",
        aviso="Es la tasa media anual armonizada: no coincide con el IPC de diciembre sobre diciembre del INE.")

# ------------------------------------------------------------------ PIB
with open(os.path.join(ROOT, "datos_web", "pib_espana_anual.csv"), encoding="utf-8") as f:
    pib = list(csv.DictReader(f))
add("pib_nominal", "PIB · precios corrientes", "PIB (INE, Eurostat)", "meur", "level",
    [(r["anio"], float(r["pib_precios_corrientes_millones_eur"])) for r in pib], territorio="España",
    glosario_id="pib_nominal",
    descripcion="Valor de todo lo que produce España en un año, a los precios de ese año, en millones de euros.",
    lectura="Sube tanto si se produce más como si suben los precios: por eso no basta para saber si la economía crece de verdad.",
    fuente="1995–2022 Eurostat (nama_10_gdp); 2023–2025 INE (Contabilidad Nacional Anual 2025)",
    origen="datos_web/pib_espana_anual.csv", interp="generic",
    aviso="Hay un pequeño salto en 2022→2023 porque cambia la fuente y la revisión estadística. 2023–2025 son provisionales o avance.")
add("pib_real_g", "PIB · crecimiento real", "PIB (INE, Eurostat)", "pct", "rate",
    [(r["anio"], float(r["variacion_real_pct"])) for r in pib if r["variacion_real_pct"] != ""], territorio="España",
    glosario_id="pib_real",
    descripcion="Cuánto crece la producción de España en volumen: es decir, descontando la subida de precios.",
    lectura="Es el dato de «crecimiento económico» de las noticias. Dos años seguidos en negativo se suele llamar recesión.",
    fuente="1996–2022 Eurostat (nama_10_gdp, CLV_PCH_PRE); 2023–2025 INE", origen="datos_web/pib_espana_anual.csv",
    interp="growth", aviso="2023–2025 provisional o avance; pueden revisarse.")
add("pib_nominal_g", "PIB · crecimiento nominal", "PIB (INE, Eurostat)", "pct", "rate",
    [(r["anio"], float(r["variacion_nominal_pct"])) for r in pib if r["variacion_nominal_pct"] != ""], territorio="España",
    glosario_id="pib_nominal",
    descripcion="Cuánto crece el PIB a precios corrientes: mezcla crecimiento real y subida de precios.",
    lectura="Si es mucho mayor que el crecimiento real, buena parte de lo que «crece» es inflación.",
    fuente="1996–2022: cálculo nuestro a partir del PIB nominal; 2023–2025: INE", origen="datos_web/pib_espana_anual.csv",
    calculado=1, nota_calculo="Para 1996–2022 la variación se calcula dividiendo el PIB de cada año entre el del año anterior; 2023–2025 la publica el INE.",
    interp="generic")


# ------------------------------------------------------------------ VIVIENDA
wb4 = openpyxl.load_workbook(os.path.join(ROOT, "04_Vivienda_y_Alquiler.xlsx"), data_only=True)


def wide_rows(ws):
    """Filas de una hoja ancha (territorio, serie, unidad, año...) → (cabecera de años, filas con datos)."""
    rows = list(ws.iter_rows(values_only=True))
    hdr = rows[0]
    cols = [i for i, h in enumerate(hdr) if str(h).isdigit()]
    yrs = [int(hdr[i]) for i in cols]
    data = [r for r in rows[1:] if r[0] in ("Madrid", "Total Nacional") and r[1]]
    return cols, yrs, data


TERR_V = {"Total Nacional": ("es", "España", "ipc_es"), "Madrid": ("mad", "Madrid", "ipc_mad")}
cols, yrs, data = wide_rows(wb4["IPV_Anual"])
IPV_KIND = {"Índice general": ("general", "general"), "Índice vivienda nueva": ("nueva", "vivienda nueva"),
            "Índice vivienda segunda mano": ("segunda", "segunda mano")}
for r in data:
    if r[1] not in IPV_KIND:
        continue   # las variaciones anuales las calcula la web (con *) a partir del índice
    k, klabel = IPV_KIND[r[1]]
    tk, tlabel, defl = TERR_V[r[0]]
    add(f"ipv_{tk}_{k}", f"Precio de la vivienda · {tlabel} · {klabel}", "Vivienda · precio de compra (IPV, INE)", "idx25", "level",
        [(y, r[c]) for y, c in zip(yrs, cols)], territorio=tlabel, glosario_id="ipv",
        descripcion=f"Índice de Precios de Vivienda del INE ({tlabel}, {klabel}): cómo evoluciona el precio de compraventa, media anual, base 2025 = 100.",
        lectura="Sube cuando las viviendas se venden más caras. Compáralo con el salario y con el IPC para ver si la vivienda se encarece más que el sueldo.",
        fuente="INE · Índice de Precios de Vivienda (IPV), tabla 80271", origen="04_Vivienda_y_Alquiler.xlsx › IPV_Anual",
        interp="generic",
        aviso="Es un índice de precios de compraventa, no euros por m². Media anual, frente al IPC de diciembre sobre diciembre.",
        deflactor=defl)

cols, yrs, data = wide_rows(wb4["Alquiler_IPVA"])
IPVA_KIND = {"Total - Índice": ("total", "total"), "Vivienda unifamiliar - Índice": ("unifam", "vivienda unifamiliar"),
             "Vivienda colectiva - Índice": ("colect", "vivienda colectiva (pisos)")}
for r in data:
    if r[1] not in IPVA_KIND:
        continue
    k, klabel = IPVA_KIND[r[1]]
    tk, tlabel, defl = TERR_V[r[0]]
    add(f"ipva_{tk}_{k}", f"Precio del alquiler · {tlabel} · {klabel}", "Vivienda · precio del alquiler (IPVA, INE)", "idx15", "level",
        [(y, r[c]) for y, c in zip(yrs, cols)], territorio=tlabel, glosario_id="ipva",
        descripcion=f"Índice de Precios de Vivienda en Alquiler del INE ({tlabel}, {klabel}), media anual, base 2015 = 100.",
        lectura="Mide cómo cambia la renta de los alquileres. Incluye contratos antiguos, así que sube menos que los alquileres que se firman hoy.",
        fuente="INE · Índice de Precios de Vivienda en Alquiler (IPVA), tabla 59056", origen="04_Vivienda_y_Alquiler.xlsx › Alquiler_IPVA",
        interp="generic",
        aviso="Se calcula con datos tributarios de todos los contratos vivos: suaviza las subidas de los alquileres nuevos. Último año: 2024.",
        deflactor=defl)

# ------------------------------------------------------------------ VIVIENDA: ESFUERZO EN AÑOS DE SALARIO
# Valor tasado medio (€/m², MIVAU vía ICANE) y años de salario bruto para pagar una vivienda tipo de 80 m².
M2_TIPO = 80
with open(os.path.join(ROOT, "datos_web", "vivienda_valor_tasado_es.csv"), encoding="utf-8") as f:
    vt = [(int(r["anio"]), float(r["valor_tasado_eur_m2"])) for r in csv.DictReader(f)]
add("viv_valor_tasado_es", "Valor tasado de la vivienda libre · España", "Vivienda · valor tasado (MIVAU)", "eurm2", "level", vt,
    territorio="España", glosario_id="valor_tasado",
    descripcion="Euros por metro cuadrado de la vivienda libre según las tasaciones hipotecarias (media de los cuatro trimestres, total nacional).",
    lectura="Es el precio por m² que valoran las tasadoras, no el de la compraventa ni el de los anuncios. Sirve para ver la tendencia de largo plazo (1995–2025).",
    fuente="Ministerio de Vivienda y Agenda Urbana · Estadística del Valor Tasado de la Vivienda (copia del ICANE)",
    origen="datos_web/vivienda_valor_tasado_es.csv", interp="generic",
    aviso="Fuente secundaria (ICANE). Es valor de tasación: suele quedar por debajo del precio de oferta de los anuncios.")
vt_d = dict(vt)
for k, label, sid in (("media", "salario medio", "sal_media_es_t"), ("mediana", "salario mediano", "sal_mediana_es_t")):
    sal = {int(y): float(v) for i, y, v in series_rows if i == sid}
    pts = [(y, M2_TIPO * vt_d[y] / sal[y]) for y in sorted(sal) if y in vt_d]
    add(f"viv_anios_salario_{k}_es", f"Años de {label} para comprar una vivienda de {M2_TIPO} m² (a precio de tasación) · España",
        "Vivienda · esfuerzo en años de salario", "anios", "level", pts, territorio="España", glosario_id="anios_salario_vivienda",
        descripcion=f"Cuántos años de {label} bruto (INE) harían falta para pagar una vivienda tipo de {M2_TIPO} m² al valor tasado medio de ese año, sin hipoteca ni gastos.",
        lectura="Cuanto más alto, más difícil es comprar con un sueldo. Compara la burbuja de 2007–2008 con el mínimo de 2013–2015 y el repunte reciente.",
        fuente="Cálculo nuestro: valor tasado (MIVAU, vía ICANE) × 80 m² ÷ salario bruto anual (INE, EES)",
        origen="datos_web/vivienda_valor_tasado_es.csv + 02_Salarios.xlsx", calculado=1,
        nota_calculo=f"{M2_TIPO} m² × valor tasado (€/m², media anual) ÷ {label} bruto anual por asalariado. Los salarios del INE empiezan en 2008.",
        interp="generic",
        aviso="Es una cota baja: usa el valor de tasación (que va por debajo del precio de compraventa y del de los anuncios), una vivienda de 80 m² y el salario bruto de una sola persona, y supone ahorrar el 100 % del sueldo. La cifra oficial del Banco de España (7,1 años en 2024, 7,6 en 2025) y la de la prensa (7–8) usan precios de mercado.")

# Referencia oficial del Banco de España (precio de la vivienda / renta bruta por hogar)
with open(os.path.join(ROOT, "datos_web", "vivienda_accesibilidad_bde.csv"), encoding="utf-8") as f:
    bde = [r for r in csv.DictReader(f) if r["periodo"].isdigit()]
for ind, sid, label, unit, lect in (
        ("precio_vivienda_renta_bruta_hogar", "viv_anios_renta_hogar_bde_es", "Años de renta bruta del hogar para comprar una vivienda · Banco de España", "anios",
         "Es la medida oficial: cuántos años de renta bruta de un hogar equivale el precio de una vivienda. Sale más alta que la nuestra porque usa precios de mercado, no de tasación."),
        ("esfuerzo_teorico_anual", "viv_esfuerzo_teorico_bde_es", "Esfuerzo teórico anual para pagar la hipoteca · Banco de España", "tasa",
         "Porcentaje de la renta del hogar que se iría cada año en la cuota de una hipoteca para comprar una vivienda. El Banco de España suele marcar el 30–35 % como zona de riesgo.")):
    pts = [(int(r["periodo"]), float(r["valor"])) for r in bde if r["indicador"] == ind]
    add(sid, label, "Vivienda · esfuerzo en años de salario", unit, "level", pts, territorio="España", glosario_id="anios_salario_vivienda",
        descripcion="Indicador de accesibilidad a la vivienda del Banco de España (media de cada año). Sólo hay 2023, 2024 y 2025 en la tabla pública que hemos podido leer.",
        lectura=lect, fuente="Banco de España · Indicadores del mercado inmobiliario, cuadro 1.5 (accesibilidad)",
        origen="datos_web/vivienda_accesibilidad_bde.csv", interp="generic",
        aviso="Sólo tres años (2023–2025). En el segundo trimestre de 2026 llega a 8,4 años y 38,0 %, que no se incluye por ser un trimestre.")

# ------------------------------------------------------------------ VIVIENDA: ALQUILER EN EUROS (IPVA anclado al SERPAVI 2022)
# El INE (IPVA) da la evolución del alquiler de todos los contratos en vigor, pero sólo como índice. El Ministerio de Vivienda
# (SERPAVI) da el nivel en euros de 2022. Multiplicando el nivel de 2022 por el índice de cada año (índice / índice de 2022)
# se obtiene una serie en euros. Ambas fuentes usan datos tributarios, así que miden lo mismo: contratos declarados.
with open(os.path.join(ROOT, "datos_web", "vivienda_alquiler_anclas_2022.csv"), encoding="utf-8") as f:
    anclas = {(r["territorio"], r["concepto"]): float(r["valor"]) for r in csv.DictReader(f)}
wb4 = openpyxl.load_workbook(os.path.join(ROOT, "04_Vivienda_y_Alquiler.xlsx"), data_only=True)
ws = wb4["Alquiler_IPVA"]
hdr = [c.value for c in ws[1]]
yrs_a = [int(h) for h in hdr[3:]]
ipva_col = {}
for r in ws.iter_rows(min_row=2, values_only=True):
    if r[1] == "Vivienda colectiva - Índice":
        ipva_col["Madrid" if r[0] == "Madrid" else "España"] = dict(zip(yrs_a, r[3:]))
for terr, tk in (("Madrid", "mad"), ("España", "es")):
    idx = ipva_col[terr]
    for concepto, sufijo, unit, etiqueta, magn in (
            ("cuantia_media_piso", "mes", "eurmes", "Alquiler medio de un piso", "euros al mes"),
            ("renta_media_piso", "m2", "eurm2mes", "Alquiler medio por m² de un piso", "euros por metro cuadrado y mes")):
        ancla = anclas[(terr, concepto)]
        pts = [(y, ancla * idx[y] / idx[2022]) for y in yrs_a]
        add(f"alq_{sufijo}_{tk}", f"{etiqueta} · {'Comunidad de Madrid' if tk == 'mad' else 'España'}", "Vivienda · alquiler en euros (cálculo nuestro)", unit, "level", pts,
            territorio="Madrid" if tk == "mad" else "España", glosario_id="alquiler_euros",
            descripcion=f"Alquiler medio de los pisos con contrato declarado, en {magn}, de 2013 a 2024.",
            lectura="Sube mucho menos que los anuncios actuales: incluye contratos antiguos que se actualizan poco. Para el alquiler que piden hoy, mira los precios de oferta (Idealista) del libro de vivienda.",
            fuente="Cálculo nuestro: SERPAVI 2022 (Ministerio de Vivienda) × índice IPVA (INE) de cada año ÷ índice de 2022",
            origen="datos_web/vivienda_alquiler_anclas_2022.csv + 04_Vivienda_y_Alquiler.xlsx › Alquiler_IPVA", calculado=1,
            nota_calculo=f"Nivel de 2022 ({ancla:g} {'€/m² y mes' if sufijo == 'm2' else '€/mes'}, SERPAVI)" + (" calculado como media ponderada de 17 CCAA" if tk == "es" else "") +
            " × índice IPVA de pisos de ese año ÷ índice IPVA de pisos de 2022 (INE, base 2015 = 100).",
            interp="generic",
            aviso="Es un cálculo nuestro, no una estadística publicada. Mide contratos en vigor (no los nuevos) y llega hasta 2024." + (" El total nacional no lo publica el Ministerio: es nuestra media de 17 CCAA, sin Navarra ni País Vasco." if tk == "es" else ""))

# ------------------------------------------------------------------ POBLACIÓN
wb5 = openpyxl.load_workbook(os.path.join(ROOT, "05_Poblacion.xlsx"), data_only=True)
ws = wb5["Historico_1971_2026"]
hist = [r for r in ws.iter_rows(min_row=2, values_only=True) if isinstance(r[0], int)]
POB = (("es", "España", 1, 2, 3), ("mad", "Madrid", 5, 6, 7))
pob_total = {}
for tk, tlabel, ct, ch, cm in POB:
    for sk, slabel, col in (("total", "total", ct), ("hombres", "hombres", ch), ("mujeres", "mujeres", cm)):
        pts = [(r[0], r[col]) for r in hist]
        if sk == "total":
            pob_total[tk] = dict(pts)
        add(f"pob_{tk}_{sk}", f"Población · {tlabel} · {slabel}", "Población (INE)", "pers", "level", pts, territorio=tlabel,
            sexo=slabel if sk != "total" else "todos", glosario_id="poblacion",
            descripcion=f"Personas residentes en {tlabel} a 1 de enero de cada año ({slabel}).",
            lectura="Es el denominador de casi todo: dividir entre la población convierte totales (PIB, gasto) en cifras por persona.",
            fuente="INE · Cifras de población / Estadística Continua de Población, tablas 56934, 56940 y 56945",
            origen="05_Poblacion.xlsx › Historico_1971_2026", interp="generic",
            aviso="Dato a 1 de enero (2026 provisional). Madrid es la Comunidad de Madrid. Las cifras de España de 2003 a 2012 son estimaciones del INE." if tk == "es"
            else "Dato a 1 de enero (2026 provisional). Madrid es la Comunidad de Madrid, no el municipio.")

add("pob_mad_pct_es", "Población · Madrid como % de España", "Población (INE)", "tasa", "level",
    [(y, pob_total["mad"][y] / pob_total["es"][y] * 100) for y in pob_total["es"]], territorio="Madrid",
    glosario_id="poblacion",
    descripcion="Qué porcentaje de los residentes en España vive en la Comunidad de Madrid.",
    lectura="Si sube, Madrid crece más deprisa que el conjunto del país.",
    fuente="Cálculo nuestro a partir de la población de Madrid y de España (INE)", origen="05_Poblacion.xlsx › Historico_1971_2026",
    calculado=1, nota_calculo="Población de Madrid ÷ población de España × 100, a 1 de enero de cada año.", interp="generic")

# PIB per cápita: PIB nominal ÷ población a 1 de enero (cálculo nuestro)
pib_pc = [(int(r["anio"]), float(r["pib_precios_corrientes_millones_eur"]) * 1e6 / pob_total["es"][int(r["anio"])])
          for r in pib if int(r["anio"]) in pob_total["es"]]
add("pib_pc", "PIB por habitante · precios corrientes", "PIB (INE, Eurostat)", "eurpc", "level", pib_pc, territorio="España",
    glosario_id="pib_pc",
    descripcion="El PIB a precios corrientes repartido entre los residentes: una forma de ver el PIB «por persona».",
    lectura="Quita el efecto de que haya más gente. Sigue incluyendo la subida de precios; para quitarla, mira su índice frente al IPC.",
    fuente="Cálculo nuestro: PIB (Eurostat/INE) ÷ población a 1 de enero (INE)", origen="datos_web/pib_espana_anual.csv + 05_Poblacion.xlsx",
    calculado=1,
    nota_calculo="PIB a precios corrientes (millones de €) × 1.000.000 ÷ población a 1 de enero. El INE usa la población media del año, así que su cifra oficial difiere unas décimas.",
    interp="generic", aviso="No coincide exactamente con el PIB por habitante que publica el INE (usa población media anual).")

# ------------------------------------------------------------------ EMPLEO (EPA)
wb1 = openpyxl.load_workbook(os.path.join(ROOT, "01_Empleo_Desempleo.xlsx"), data_only=True)
ws = wb1["EPA_Paro_Anual_SexoEdad"]
rows = list(ws.iter_rows(values_only=True))
pyears = [int(h) for h in rows[0][4:]]
T_EPA = {"España": ("es", "España"), "Comunidad de Madrid": ("mad", "Madrid")}
S_EPA = {"Ambos sexos": ("t", "todos"), "Hombres": ("h", "hombres"), "Mujeres": ("m", "mujeres")}
E_EPA = {"Todas las edades": ("total", "todas las edades"), "Menos de 25": ("m25", "menores de 25"),
         "25 y más": ("g25", "25 y más"), "16 a 19": ("a1619", "16 a 19 años"), "20 a 24": ("a2024", "20 a 24 años"),
         "25 a 54": ("a2554", "25 a 54 años"), "55 y más": ("g55", "55 y más")}
for r in rows[1:]:
    if not (r[1] and str(r[1]).startswith("EPA")):
        continue
    tk, tlabel = T_EPA[r[0]]
    sk, slabel = S_EPA[r[2]]
    ek, elabel = E_EPA[r[3]]
    add(f"paro_{tk}_{sk}_{ek}", f"Tasa de paro · {tlabel} · {slabel} · {elabel}",
        "Tasa de paro (EPA, INE) · ambos sexos" if sk == "t" else "Tasa de paro (EPA, INE) · hombres y mujeres",
        "tasa", "level", zip(pyears, r[4:]), territorio=tlabel, sexo=slabel, glosario_id="tasa_paro",
        descripcion=f"Porcentaje de la población activa que no tiene empleo y lo busca ({tlabel}, {slabel}, {elabel}). Media anual.",
        lectura="Es el «paro» de las noticias de la EPA. Sube en las crisis (el máximo fue en 2013) y es mucho mayor entre los jóvenes.",
        fuente="INE · Encuesta de Población Activa, tabla 74999, código " + r[1], origen="01_Empleo_Desempleo.xlsx › EPA_Paro_Anual_SexoEdad",
        interp="generic",
        aviso="En índice o variación el cambio es relativo (de un 8 % a un 10 % es +25 %), no en puntos porcentuales. Ver en «brutos» para leer los puntos.")

ws = wb1["EPA_Tasas_Anual_Calc"]
rows = list(ws.iter_rows(values_only=True))
tyears = [int(h) for h in rows[0][5:]]
IND = {"Tasa de empleo": ("empleo", "Tasa de empleo", "tasa_empleo",
                          "Porcentaje de la población de 16 y más años que tiene empleo.",
                          "Sube cuando hay más gente trabajando en relación con la población en edad de trabajar."),
       "Tasa de actividad": ("activ", "Tasa de actividad", "tasa_actividad",
                             "Porcentaje de la población de 16 y más años que trabaja o busca trabajo.",
                             "Mide cuánta gente participa en el mercado laboral, tenga o no empleo.")}
for r in rows[1:]:
    if r[0] not in IND or r[3] not in ("Total", "Menores de 25", "25 y más"):
        continue
    ik, ilabel, gl, desc, lect = IND[r[0]]
    tk, tlabel = T_EPA[r[1]]
    ek, elabel = {"Total": ("total", "todas las edades"), "Menores de 25": ("m25", "menores de 25"), "25 y más": ("g25", "25 y más")}[r[3]]
    add(f"tasa_{ik}_{tk}_{ek}", f"{ilabel} · {tlabel} · {elabel}", "Empleo y actividad (EPA, INE)", "tasa", "level",
        [(y, v) for y, v in zip(tyears, r[5:]) if v not in (None, "")], territorio=tlabel, sexo="todos", glosario_id=gl,
        descripcion=f"{desc} {tlabel}, {elabel}. Media anual.", lectura=lect,
        fuente="INE · Encuesta de Población Activa (series trimestrales, código " + r[4] + "); media anual: cálculo nuestro",
        origen="01_Empleo_Desempleo.xlsx › EPA_Tasas_Anual_Calc", calculado=1,
        nota_calculo="Media de las cuatro tasas trimestrales de cada año (el INE publica la tasa trimestral). Solo se calcula si hay los 4 trimestres.",
        interp="generic",
        aviso="En índice o variación el cambio es relativo, no en puntos porcentuales.")


# ------------------------------------------------------------------ SALARIOS · EDAD, SECTOR, OCUPACIÓN, CONTRATO
ws = wb["EES_Edad"]
rows = list(ws.iter_rows(values_only=True))
ey = [int(h) for h in rows[0][5:]]
AGE = {"Menos de 20": ("m20", "menos de 20 años"), "20 a 24": ("20_24", "20 a 24 años"), "25 a 29": ("25_29", "25 a 29 años"),
       "30 a 34": ("30_34", "30 a 34 años"), "35 a 39": ("35_39", "35 a 39 años"), "40 a 44": ("40_44", "40 a 44 años"),
       "45 a 49": ("45_49", "45 a 49 años"), "50 a 54": ("50_54", "50 a 54 años"), "55 a 59": ("55_59", "55 a 59 años"),
       "60 a 64": ("60_64", "60 a 64 años"), "65 y más": ("g65", "65 y más años"), "Menos de 25": ("m25", "menos de 25 años"),
       "25 a 34": ("25_34", "25 a 34 años"), "35 a 44": ("35_44", "35 a 44 años"), "45 a 54": ("45_54", "45 a 54 años"),
       "55 y más": ("g55", "55 y más años")}
SEXO_E = {"Ambos sexos": ("t", "todos"), "Mujeres": ("m", "mujeres"), "Hombres": ("h", "hombres")}
TERR_E = {"Total Nacional": ("es", "España", "ipc_es"), "Comunidad de Madrid": ("mad", "Madrid", "ipc_mad")}
skipped_sample = []
for r in rows[1:]:
    if not r[1] or r[3] == "Todas las edades":      # «todas las edades» ya está en el selector de salarios
        continue
    vals = list(r[5:])
    if any(v in (None, "") for v in vals):          # el INE no publica los años con menos de 100 observaciones
        skipped_sample.append(r[1])
        continue
    tk, tlabel, defl = TERR_E[r[4]]
    sk, slabel = SEXO_E[r[2]]
    ak, alabel = AGE[r[3]]
    add(f"sal_edad_{tk}_{sk}_{ak}", f"Salario medio · {tlabel} · {slabel} · {alabel}",
        f"Salario medio por edad · {tlabel} · {slabel}", "eur", "level", zip(ey, vals), territorio=tlabel, sexo=slabel,
        medida="Salario medio", glosario_id="media",
        descripcion=f"Salario medio bruto anual de los asalariados de {alabel} ({tlabel}, {slabel}).",
        lectura="Muestra cómo cambia el sueldo a lo largo de la vida laboral y si los jóvenes han mejorado menos que los mayores.",
        fuente=f"INE · Encuesta Anual de Estructura Salarial, tabla {r[0]}, código {r[1]}", origen="02_Salarios.xlsx › EES_Edad",
        interp="wage",
        aviso="Salario bruto anual medio. En los tramos con pocos trabajadores el INE avisa de muestra pequeña (100–500 observaciones): úsalo con cautela.",
        deflactor=defl)

ws = wb["EES_Sector_Ocup_Contrato"]
rows = [r for r in ws.iter_rows(values_only=True)]
sy = [int(h) for h in rows[0][4:] if str(h).isdigit()]   # tras los años hay columnas de variación calculadas
DIM = {"Sector (CNAE-09)": ("sector", "Salario medio por sector (INE)", "sector de actividad"),
       "Ocupación (CNO-11)": ("ocup", "Salario medio por ocupación (INE)", "ocupación"),
       "Tipo de contrato": ("contrato", "Salario medio por tipo de contrato (INE)", "tipo de contrato")}
for r in rows[1:]:
    if r[0] not in DIM or r[3] in ("Total", "Todas las ocupaciones"):
        continue
    dk, group, dlabel = DIM[r[0]]
    if dk == "sector":
        key = r[3].split()[0].lower()
        name = r[3].split(" ", 1)[1]
    elif dk == "ocup":
        key = r[2].lower()
        name = r[3]
    else:
        key = r[3].lower()
        name = r[3]
    add(f"sal_{dk}_{key}", f"Salario medio · {name}", group, "eur", "level", zip(sy, r[4:4 + len(sy)]), territorio="España", sexo="todos",
        medida="Salario medio", glosario_id="media",
        descripcion=f"Salario medio bruto anual de los asalariados según su {dlabel}: «{name}» (España).",
        lectura="Compáralo con el salario medio de todos para ver qué sectores u ocupaciones cobran por encima o por debajo.",
        fuente=f"INE · Encuesta Anual de Estructura Salarial, tabla {r[1]}, código {r[2]}",
        origen="02_Salarios.xlsx › EES_Sector_Ocup_Contrato", interp="wage",
        aviso="Salario bruto anual medio, solo España. Sector según CNAE-09, ocupación según CNO-11; no incluye agricultura.",
        deflactor="ipc_es")

ws = wb["EES_Desigualdad_SMI"]
rows = list(ws.iter_rows(values_only=True))
dy = [int(h) for h in rows[0][5:]]
for r in rows[1:]:
    if not r[1]:
        continue
    cod, sexo, concepto = r[1], r[2], r[3]
    sk, slabel = SEXO_E[sexo]
    if concepto.startswith("Índice de Gini"):
        unit, group, gl = "puntos", "Desigualdad salarial (INE)", "gini"
    elif concepto.startswith(("D9/D", "D5/D")):
        unit, group, gl = "veces", "Desigualdad salarial (INE)", "deciles"
    elif "SMI" in concepto:
        unit, group, gl = "tasa", f"Trabajadores por tramo de SMI · {slabel}", "smi"
    else:
        unit, group, gl = "tasa", "Desigualdad salarial (INE)", "ganancia_baja"
    smi_break = "SMI" in concepto
    add(f"ees_{cod.lower()}", concepto[0].upper() + concepto[1:] + ("" if sk == "t" or "mujeres" in concepto.lower() else f" ({slabel})"),
        group, unit, "level", zip(dy, r[5:]), territorio="España", sexo=slabel, glosario_id=gl,
        descripcion=f"{concepto}. España, {slabel}.",
        lectura="Mide cómo se reparten los salarios. Si el Gini o los cocientes suben, la desigualdad aumenta." if not smi_break
        else "Reparte a los asalariados según cuántas veces el salario mínimo cobran. Una tasa alta en «0-1 SMI» indica mucho empleo mal pagado.",
        fuente=f"INE · Encuesta Anual de Estructura Salarial, tabla {r[0]}, código {cod}", origen="02_Salarios.xlsx › EES_Desigualdad_SMI",
        interp="generic",
        aviso=("Ruptura metodológica entre 2018 y 2019 en los tramos de SMI: no compares tasas de antes y después sin cautela. "
               if smi_break else "") + "En índice o variación el cambio es relativo, no en puntos.")

# ------------------------------------------------------------------ GASTO DE LOS HOGARES (EPF) Y RENTA (ECV)
EPF_G = {"Alimentos y bebidas no alcohólicas": "alimentos", "Bebidas alcohólicas y tabaco": "alcohol_tabaco", "Vestido y calzado": "vestido",
         "Vivienda agua electricidad gas y otros combustibles": "vivienda", "Muebles y artículos del hogar": "muebles",
         "Sanidad": "sanidad", "Transporte": "transporte", "Comunicaciones": "comunicaciones", "Ocio y cultura": "ocio",
         "Enseñanza": "ensenanza", "Restaurantes y hoteles": "restaurantes", "Otros bienes y servicios": "otros",
         "General": "total", "Índice general": "total"}
EPF_M = {"Gasto medio por hogar": ("hogar", "Gasto por hogar", "Gasto medio por hogar (EPF, INE)", "eur_gasto"),
         "Gasto medio por persona": ("persona", "Gasto por persona", "Gasto medio por persona (EPF, INE)", "eur_gasto"),
         "Distribución %": ("peso", "Peso en el gasto", "Reparto del gasto de los hogares (EPF, INE)", "tasa")}
for sheet, tk, tlabel, defl in (("EPF_Nacional_2018_2023", "es", "España", "ipc_es"), ("EPF_Madrid_2018_2023", "mad", "Madrid", "ipc_mad")):
    rows = list(wb2[sheet].iter_rows(values_only=True))
    fy = [int(h) for h in rows[0][1:] if str(h).isdigit()]
    for r in rows[1:]:
        if not r[0] or " - " not in r[0]:
            continue
        grupo, medida = r[0].rsplit(" - ", 1)
        if medida not in EPF_M or grupo not in EPF_G:
            continue
        mk, mlabel, mgroup, unit = EPF_M[medida]
        gk = EPF_G[grupo]
        gname = "Total" if gk == "total" else grupo
        add(f"epf_{tk}_{gk}_{mk}", f"{mlabel} · {tlabel} · {gname}", f"{mgroup} · {tlabel}", unit, "level",
            zip(fy, r[1:1 + len(fy)]), territorio=tlabel, glosario_id="epf",
            descripcion=f"{mlabel} en «{gname}» ({tlabel}), según la Encuesta de Presupuestos Familiares.",
            lectura="Muestra en qué se va el dinero de las familias. Vivienda, alimentos y transporte suelen sumar más de la mitad." if mk == "peso"
            else "Euros que gasta de media cada hogar (o persona) al año en este grupo.",
            fuente="INE · Encuesta de Presupuestos Familiares (base 2006), tabla 14505", origen=f"03_Coste_de_la_Vida.xlsx › {sheet}",
            interp="generic",
            aviso="Importes nominales (sin quitar la inflación). Último año publicado: 2023. Grupos ECOICOP v1, que no coinciden con los 14 del IPC de 2026."
            + (" Madrid es la Comunidad de Madrid." if tk == "mad" else ""),
            deflactor=defl if unit == "eur_gasto" else "")

ws = wb2["ECV_Renta_Pobreza"]
rows = list(ws.iter_rows(values_only=True))
TERR_C = {"Total Nacional": ("es", "España", "ipc_es"), "Madrid": ("mad", "Madrid", "ipc_mad")}
RENTA = {"Renta neta media por persona": ("persona", "por persona"),
         "Renta neta media por unidad de consumo": ("uc", "por unidad de consumo"),
         "Renta neta media por persona (con alquiler imputado)": ("persona_alq", "por persona, con alquiler imputado"),
         "Renta neta media por unidad de consumo (con alquiler imputado)": ("uc_alq", "por unidad de consumo, con alquiler imputado")}
POBR = {"AROPE (riesgo de pobreza o exclusión social)": ("arope", "AROPE: riesgo de pobreza o exclusión social", "arope"),
        "En riesgo de pobreza (renta año anterior a la entrevista)": ("pobreza", "Riesgo de pobreza", "arope"),
        "Carencia material y social severa": ("carencia", "Carencia material y social severa", "arope"),
        "Baja intensidad en el trabajo (0-64 años)": ("baja_int", "Baja intensidad en el trabajo (0-64 años)", "arope")}
ryears = block = None
for r in rows:
    if r[0] == "territorio":
        block = "renta" if "renta" in str(r[1]) else "pobreza"
        ys_idx = [(i, int(h)) for i, h in enumerate(r) if str(h).isdigit()]
        continue
    if block == "renta" and r[0] in TERR_C and r[1] in RENTA:
        tk, tlabel, defl = TERR_C[r[0]]
        mk, mlabel = RENTA[r[1]]
        add(f"ecv_renta_{tk}_{mk}", f"Renta neta media {mlabel} · {tlabel}", "Renta y pobreza (ECV, INE)", "eur_neto", "level",
            [(y, r[i]) for i, y in ys_idx], territorio=tlabel, glosario_id="ecv",
            descripcion=f"Renta neta media anual {mlabel} ({tlabel}): lo que queda a los hogares tras impuestos y cotizaciones.",
            lectura="Es renta del hogar (no solo salario). Se refiere al año anterior al de la encuesta.",
            fuente="INE · Encuesta de Condiciones de Vida, tabla 49145", origen="03_Coste_de_la_Vida.xlsx › ECV_Renta_Pobreza",
            interp="generic", aviso="Solo 3 años (2023–2025). El año es el de la encuesta; la renta es del año anterior.", deflactor=defl)
    elif block == "pobreza" and r[0] in TERR_C and r[1] in POBR:
        tk, tlabel, _ = TERR_C[r[0]]
        ik, ilabel, gl = POBR[r[1]]
        add(f"ecv_{ik}_{tk}", f"{ilabel} · {tlabel}", "Renta y pobreza (ECV, INE)", "tasa", "level",
            [(y, r[i]) for i, y in ys_idx], territorio=tlabel, glosario_id=gl,
            descripcion=f"{ilabel} ({tlabel}): porcentaje de la población en esta situación.",
            lectura="Es una medida de pobreza relativa: depende de cómo vive el resto del país, no de un mínimo absoluto.",
            fuente="INE · Encuesta de Condiciones de Vida, tabla 76847", origen="03_Coste_de_la_Vida.xlsx › ECV_Renta_Pobreza",
            interp="generic", aviso="En índice o variación el cambio es relativo, no en puntos porcentuales.")

# ------------------------------------------------------------------ PIB: AGREGADOS Y EDUCACIÓN (datos_web)
with open(os.path.join(ROOT, "datos_web", "pib_agregados_2023_2025.csv"), encoding="utf-8") as f:
    agg = list(csv.DictReader(f))
AGG = (("pib_pc_ine", "PIB por habitante · INE", "eurpc", "pib_per_capita_eur", "pib_pc",
        "PIB por habitante publicado por el INE.", "Compáralo con nuestro cálculo (PIB ÷ población a 1 de enero), que usa otra población."),
       ("pib_remuneracion", "Remuneración de los asalariados", "meur", "remuneracion_asalariados_millones", "remuneracion",
        "Todo lo que se paga a los asalariados (sueldos y cotizaciones sociales de la empresa), en millones de euros.",
        "Es la parte del PIB que va al trabajo. Dividida entre el PIB da la «parte salarial»."),
       ("pib_excedente", "Excedente bruto y renta mixta", "meur", "excedente_bruto_y_renta_mixta_millones", "remuneracion",
        "Lo que queda a empresas y autónomos tras pagar salarios, en millones de euros.",
        "Es la parte del PIB que va al capital y a los autónomos."),
       ("pib_impuestos_netos", "Impuestos netos sobre producción e importaciones", "meur", "impuestos_netos_produccion_importaciones_millones", "remuneracion",
        "Impuestos como el IVA menos subvenciones, en millones de euros.", "Es la parte del PIB que recauda el Estado por producir y consumir."),
       ("ocupados_cn", "Ocupados (Contabilidad Nacional)", "miles", "ocupados_miles", "remuneracion",
        "Personas con empleo según la Contabilidad Nacional, en miles.", "No coincide con la EPA: usa otra metodología."),
       ("horas_cn", "Horas trabajadas (Contabilidad Nacional)", "mhoras", "horas_trabajadas_miles", "remuneracion",
        "Total de horas trabajadas en el año, en miles.", "Dividir el PIB entre las horas da la productividad por hora."))
for id_, label, unit, col, gl, desc, lect in AGG:
    add(id_, label, "PIB (INE, Eurostat)", unit, "level", [(r["anio"], float(r[col])) for r in agg if r[col] != ""], territorio="España",
        glosario_id=gl, descripcion=desc, lectura=lect, fuente="INE · Contabilidad Nacional Anual de España 2025 (18-sep-2026)",
        origen="datos_web/pib_agregados_2023_2025.csv", interp="generic",
        aviso="Solo 2023–2025: 2023 definitivo o provisional, 2024 provisional, 2025 avance. Pueden revisarse.")
add("pib_deflactor_g", "Deflactor del PIB · variación anual", "PIB (INE, Eurostat)", "pct", "rate",
    [(r["anio"], float(r["deflactor_pib_pct"])) for r in agg if r["deflactor_pib_pct"] != ""], territorio="España", glosario_id="inflacion",
    descripcion="Cuánto suben los precios de todo lo que produce el país (no solo de lo que consumen las familias).",
    lectura="Es otra forma de medir la inflación: sirve para pasar del PIB nominal al real.",
    fuente="INE · Contabilidad Nacional Anual de España 2025", origen="datos_web/pib_agregados_2023_2025.csv", interp="inflation",
    aviso="Solo 2024 y 2025 (provisional y avance).")

with open(os.path.join(ROOT, "datos_web", "educacion_gasto_publico_serie.csv"), encoding="utf-8") as f:
    edu = list(csv.DictReader(f))
EDU_AVISO = ("Serie desde 2019: el dato de 2014 (44.789 M€) no se incluye porque faltan 2015–2018 y la línea uniría ambos años sin datos. "
             "Cifra oficial leída en un informe de prensa (fuente secundaria): contrastar. 2024 es avance.")
add("edu_gasto_publico", "Gasto público en educación", "Educación (gasto público)", "meur", "level",
    [(r["anio"], float(r["gasto_publico_millones_eur"])) for r in edu if int(r["anio"]) >= 2019], territorio="España",
    glosario_id="gasto_educacion",
    descripcion="Lo que gastan todas las administraciones en educación, en millones de euros.",
    lectura="Compáralo con el PIB para ver si la educación pesa más o menos que antes.",
    fuente="Informe «Indicadores comentados 2026» recogido por El Español (fuente secundaria)", origen="datos_web/educacion_gasto_publico_serie.csv",
    interp="generic", aviso=EDU_AVISO)
add("edu_gasto_pct_pib", "Gasto público en educación · % del PIB", "Educación (gasto público)", "tasa", "level",
    [(r["anio"], float(r["porcentaje_pib"])) for r in edu if r["porcentaje_pib"] != ""], territorio="España", glosario_id="gasto_educacion",
    descripcion="El gasto público en educación como porcentaje del PIB.",
    lectura="Un valor más alto significa que el país destina una parte mayor de lo que produce a educación.",
    fuente="Informe «Indicadores comentados 2026» recogido por El Español (fuente secundaria)", origen="datos_web/educacion_gasto_publico_serie.csv",
    interp="generic", aviso="Fuente secundaria: contrastar. 2024 es avance. En índice o variación el cambio es relativo, no en puntos.")

# ------------------------------------------------------------------ GLOSARIO
GLOS = [
 ("media", "Media", "Suma de todos los valores dividida entre cuántos son.",
  "Es muy sensible a los valores extremos: unos pocos sueldos muy altos la elevan. Si la media supera mucho a la mediana, hay desigualdad por arriba.",
  "Si cuatro personas cobran 1.000 € y una cobra 11.000 €, la media es 3.000 € pero casi nadie cobra eso."),
 ("mediana", "Mediana", "El valor «de en medio»: la mitad queda por debajo y la otra mitad por encima.",
  "Representa mejor al trabajador típico que la media, porque no se deja arrastrar por los extremos.",
  "En el ejemplo anterior la mediana es 1.000 €."),
 ("percentil", "Percentil", "El percentil N es el valor que deja por debajo al N % de la población.",
  "P10 describe la parte baja de la escala y P90 la alta. La distancia entre ambos mide la desigualdad salarial.",
  "Con un P90 de 52.000 €, solo uno de cada diez asalariados cobra más."),
 ("cuartil", "Cuartil", "Divide a la población en cuatro partes iguales: el inferior deja debajo al 25 % y el superior al 75 %.",
  "Entre el cuartil inferior y el superior está la mitad central de los asalariados.", ""),
 ("salario_bruto", "Salario bruto", "Lo que cobra el trabajador antes de descontar IRPF y cotizaciones a la Seguridad Social.",
  "El neto que llega a la cuenta es bastante menor. Aquí todo salario es bruto anual.", ""),
 ("salario_nominal", "Salario nominal", "El salario medido en euros de cada año, sin corregir la inflación.",
  "Puede subir cada año y, aun así, comprar menos si los precios suben más rápido.", ""),
 ("salario_real", "Salario real*", "El salario nominal corregido por la subida de precios: mide cuánto puedes comprar con él.",
  "Si sube, ganas poder adquisitivo; si baja, lo pierdes aunque tu nómina sea mayor. Lo calculamos nosotros: salario nominal ÷ índice de precios.",
  "Si cobras un 3 % más y los precios suben un 5 %, tu salario real baja un 1,9 %."),
 ("poder_adquisitivo", "Poder adquisitivo", "La cantidad de bienes y servicios que puedes comprar con una cantidad de dinero.",
  "Cuando hay inflación, el mismo dinero compra cada vez menos.", ""),
 ("smi", "Salario mínimo (SMI)", "El salario mensual más bajo que legalmente se puede pagar por una jornada completa.",
  "Se fija cada año por real decreto. Aquí se muestra en euros al año (14 pagas).", ""),
 ("ipc_dicdic", "IPC (diciembre sobre diciembre)", "Índice de Precios de Consumo: cuánto cambia el precio de una cesta representativa de lo que consumen los hogares.",
  "Positivo = inflación (los precios suben, el dinero compra menos). Cerca del 2 % se considera estable; por encima del 5 % ya duele; por debajo de 0 es deflación. Esta versión compara diciembre con el diciembre anterior.",
  "Con un IPC del +3 %, una cesta que costaba 100 € el año pasado cuesta 103 €."),
 ("ipca", "IPCA (IPC armonizado)", "Versión del IPC calculada con las reglas comunes de la UE, para poder comparar países.",
  "Se publica por grupos (alimentos, vivienda, transporte...) y aquí se usa la tasa media anual. No coincide exactamente con el IPC del INE.", ""),
 ("inflacion", "Inflación", "Subida general y sostenida de los precios.", "El Banco Central Europeo considera estable una inflación cercana al 2 %.", ""),
 ("pib_nominal", "PIB a precios corrientes", "Valor, a precios de cada año, de todos los bienes y servicios finales que produce el país en un año.",
  "Crece tanto si se produce más como si se encarece lo producido. Para comparar años distintos hay que corregir los precios: eso es el PIB real.", ""),
 ("pib_real", "PIB real (volumen)", "Lo que se produce, medido con precios constantes, es decir, sin el efecto de la inflación.",
  "Su variación anual es el «crecimiento económico». Positivo = la economía produce más; negativo = produce menos. Dos trimestres seguidos negativos suelen llamarse recesión.", ""),
 ("indice_base", "Índice base 100*", "Convierte cada serie en una escala común: el valor del año base pasa a ser 100 y el resto se expresa en relación con él.",
  "Un 120 significa un 20 % más que en el año base. Permite comparar en un mismo gráfico cosas que se miden en unidades distintas. Es un cálculo nuestro.", ""),
 ("variacion_anual", "Variación anual*", "Cuánto cambia un valor respecto al año anterior, en %.",
  "Es lo que se llama «tasa interanual». Cálculo nuestro cuando partimos de una serie en niveles.", ""),
 ("variacion_acumulada", "Variación acumulada*", "Cuánto ha cambiado un valor desde el año base hasta cada año, en %.",
  "Un +25 % acumulado en 2024 significa que el valor es un 25 % mayor que en el año base. Es un cálculo nuestro.", ""),
 ("tasa_media", "Tasa media anual*", "Ritmo medio de crecimiento por año entre dos fechas (tasa compuesta).",
  "Es el crecimiento constante que daría el mismo resultado final. Cálculo nuestro.", ""),
 ("ipv", "Índice de Precios de Vivienda (IPV)", "Índice del INE que sigue el precio de compraventa de las viviendas, nuevas y de segunda mano.",
  "No da euros por metro cuadrado: da la evolución. Un 120 respecto a otro año es un 20 % más caro. Aquí usamos la media anual.",
  "Si el IPV sube un 12 % y los sueldos un 3 %, comprar casa es cada vez más difícil para el mismo sueldo."),
 ("anios_salario_vivienda", "Años de salario para una vivienda*", "Cuántos años de salario bruto costaría una vivienda tipo de 80 m², sin hipoteca.",
  "Lo calculamos nosotros: 80 m² × valor tasado por m² ÷ salario bruto anual. Es una cota baja: usa la tasación (por debajo del precio de venta), el sueldo de una sola persona y supone ahorrarlo entero. Ningún comprador ahorra el 100 % de su sueldo, así que el plazo real es bastante más largo. Para precios de mercado y renta del hogar, la medida oficial es la del Banco de España (7,1 años en 2024).",
  "Con un valor tasado de 1.900 €/m² y un salario de 29.500 €, una vivienda de 80 m² cuesta 5,2 años de sueldo. Si ahorras el 15 % de ese sueldo cada año, necesitarías más de 35 años."),
 ("valor_tasado", "Valor tasado", "Valor que una sociedad de tasación asigna a una vivienda para concederle una hipoteca.",
  "El Ministerio de Vivienda publica su media por m². No es el precio al que se vende ni el de los anuncios: suele ir por debajo.",
  "Un piso tasado en 150.000 € puede anunciarse en 175.000 €."),
 ("alquiler_euros", "Alquiler en euros*", "Alquiler medio de los pisos con contrato declarado a Hacienda, en euros al mes o por metro cuadrado.",
  "Lo calculamos nosotros: el nivel de 2022 del Ministerio de Vivienda (SERPAVI) llevado a otros años con el índice IPVA del INE. Incluye todos los contratos en vigor, también los antiguos, por eso sube menos que los anuncios de hoy (en Idealista, el m² de alquiler en España ronda 15 € en 2026 frente a los 7,8 € de 2022 de esta serie).",
  "Si el alquiler medio de un piso en Madrid era de 738 € en 2022 y el índice sube un 6 % hasta 2024, la serie marca unos 782 €."),
 ("ipva", "Índice de precios del alquiler (IPVA)", "Índice del INE que sigue cuánto cambian las rentas de los alquileres, con datos tributarios de todos los contratos.",
  "Incluye contratos antiguos, que se actualizan poco: por eso sube menos que los alquileres que se firman hoy.", ""),
 ("epa", "EPA", "Encuesta de Población Activa: la encuesta trimestral del INE a unas 65.000 familias que mide cuánta gente trabaja, busca trabajo o está inactiva.",
  "Es la fuente oficial de la tasa de paro. No es lo mismo que el paro registrado, que cuenta a quienes se apuntan en el SEPE.", ""),
 ("tasa_paro", "Tasa de paro", "Porcentaje de la población activa (la que trabaja o busca trabajo) que no tiene empleo.",
  "Una tasa del 10 % significa que uno de cada diez activos busca empleo sin tenerlo. No cuenta a quien ha dejado de buscar.",
  "Con 25 millones de activos y un 10 % de paro hay 2,5 millones de parados."),
 ("tasa_empleo", "Tasa de empleo", "Porcentaje de la población de 16 y más años que tiene trabajo.",
  "Complementa el paro: el paro puede bajar porque hay más empleo o porque la gente deja de buscar. La tasa de empleo distingue ambos casos.", ""),
 ("tasa_actividad", "Tasa de actividad", "Porcentaje de la población de 16 y más años que trabaja o busca trabajo.",
  "Si sube, más gente se incorpora al mercado laboral (por ejemplo, mujeres o inmigrantes).", ""),
 ("poblacion", "Población residente", "Personas que viven habitualmente en un territorio, a 1 de enero de cada año.",
  "Cuando la población crece, el PIB o el gasto total pueden subir sin que cada persona esté mejor. Por eso se mira «por habitante».", ""),
 ("pib_pc", "PIB por habitante*", "El PIB dividido entre el número de residentes.",
  "Sirve para comparar el tamaño de la economía quitando el efecto de que haya más gente. Cálculo nuestro: PIB ÷ población a 1 de enero.", ""),
 ("gini", "Índice de Gini", "Mide la desigualdad con un número entre 0 (todos cobran lo mismo) y 100 (uno solo se lo lleva todo).",
  "En salarios, valores cerca de 30 son habituales en Europa. Si sube, la distribución se vuelve más desigual.", ""),
 ("deciles", "Cociente de deciles (D9/D1…)", "Compara a los que más cobran con los que menos: el D9 deja por debajo al 90 % y el D1 al 10 %.",
  "Un D9/D1 de 3,8 quiere decir que quien está en el límite del 10 % mejor pagado cobra 3,8 veces lo que quien está en el límite del 10 % peor pagado.", ""),
 ("ganancia_baja", "Ganancia baja (low pay)", "Porcentaje de asalariados cuya ganancia por hora es menor que dos tercios de la mediana.",
  "Es una medida de empleo mal pagado relativa al resto: si sube, crece la parte de trabajadores con sueldos bajos frente al típico.", ""),
 ("epf", "EPF", "Encuesta de Presupuestos Familiares: el INE pregunta a miles de hogares en qué gastan su dinero.",
  "Permite ver cuánto pesa la vivienda, la comida o el transporte en el gasto de una familia media.", ""),
 ("ecv", "ECV", "Encuesta de Condiciones de Vida: el INE mide ingresos, pobreza y privaciones de los hogares.",
  "El año de la encuesta no es el de la renta: la renta es la del año anterior.", ""),
 ("arope", "AROPE y pobreza", "Indicador europeo de riesgo de pobreza o exclusión social: suma pobreza de renta, carencia material severa y baja intensidad de trabajo.",
  "Es una medida relativa: si todos ganan más, el umbral de pobreza también sube.", ""),
 ("remuneracion", "Reparto del PIB", "El PIB se reparte entre trabajo (remuneración de los asalariados), capital y autónomos (excedente) y Estado (impuestos netos).",
  "Si la parte del trabajo baja mientras el PIB sube, el crecimiento llega menos a los sueldos.", ""),
 ("gasto_educacion", "Gasto público en educación", "Lo que gastan las administraciones públicas en educación.",
  "Se suele expresar en euros y como porcentaje del PIB para poder compararlo entre años y países.", ""),
 ("recesion", "Recesión", "Periodo en que la economía se contrae.", "Se suele identificar cuando el PIB real cae en dos periodos consecutivos.", ""),
 ("vab", "Valor añadido bruto (VAB)", "Lo que añade cada sector a la producción: lo que vende menos lo que compra a otros para producir.",
  "El PIB es la suma del valor añadido de todas las ramas más los impuestos netos sobre los productos (como el IVA). Por eso un sector pesa más sobre el valor añadido que sobre el PIB.", ""),
]

# ------------------------------------------------------------------ ESCRIBIR
def write_csv(name, header, rows):
    with open(os.path.join(OUT, name), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)

write_csv("series.csv", ["id", "year", "value"], sorted(series_rows, key=lambda r: (r[0], r[1])))
write_csv("catalog.csv", CAT_COLS, [[c[k] for k in CAT_COLS] for c in catalog])
write_csv("glossary.csv", ["id", "term", "short", "long", "example"], GLOS)
# Parámetros del simulador: se copian tal cual (la web los lee y los convierte en el navegador)
import shutil
SIM_FILES = [
    "irpf_parametros", "irpf_escala_estatal", "irpf_escala_autonomica_madrid",
    "cotizaciones_ss_tipos_2026", "cotizaciones_ss_bases_2026", "cotizacion_solidaridad_2026",
    "cotizacion_at_ep_ejemplos_2026", "cotizaciones_parametros_2026",
    "gasto_publico_cofog_2024", "sanidad_costes_servicios", "sanidad_gasto_agregado",
    "educacion_gasto_por_alumno", "educacion_precios_familias",
    "transporte_costes", "transporte_tarifas_madrid_2026",
    "ejemplos_validacion_irpf_ss_2026",
    "desempleo_duracion", "desempleo_parametros_2026",
    "autonomos_cotizacion_2026", "autonomos_parametros_2026", "autonomos_cese_actividad_duracion",
]
# Reparto del PIB por ramas (INE): se copia tal cual; la web calcula los porcentajes y los marca con *
shutil.copyfile(os.path.join(ROOT, "datos_web", "pib_sectores_vab_2024_2025.csv"), os.path.join(OUT, "pib_sectores.csv"))
SIM_OUT = os.path.join(OUT, "sim")
os.makedirs(SIM_OUT, exist_ok=True)
for name in SIM_FILES:
    shutil.copyfile(os.path.join(ROOT, "datos_web", name + ".csv"), os.path.join(SIM_OUT, name + ".csv"))

print(f"series={len(catalog)} puntos={len(series_rows)} glosario={len(GLOS)} sim={len(SIM_FILES)} -> {OUT}")

# Textos en inglés (catalog_en.csv, glossary_en.csv, pib_sectores_en.csv): se generan a partir de los CSV
# anteriores con las traducciones de tools/web_en*.py. Si falta alguna traducción, el script lo lista y falla.
sys.path.insert(0, here)
import web_en
n_en, g_en, s_en = web_en.write_all(OUT)
print(f"inglés: series={n_en} glosario={g_en} ramas={s_en}")
