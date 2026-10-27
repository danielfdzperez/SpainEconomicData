"""Traducción al inglés de los trozos con los que se forman las etiquetas del catálogo
(«Salario medio · España · todos» = tres trozos unidos con « · ») y de los valores que se cuelan
en las descripciones (territorio, sexo, grupos de gasto, sectores, edades…).

Cada trozo se traduce siempre igual, sea en la etiqueta o dentro de una frase.
"""
import re

PARTS = {
    # territorios, sexo, medidas
    "España": "Spain", "Madrid": "Madrid", "Comunidad de Madrid": "Community of Madrid", "Banco de España": "Bank of Spain",
    "todos": "all", "mujeres": "women", "hombres": "men", "total": "total", "Total": "Total", "general": "general",
    "Salario medio": "Mean wage", "Salario P10": "P10 wage", "Salario P25": "P25 wage", "Salario mediano": "Median wage",
    "Salario P75": "P75 wage", "Salario P90": "P90 wage", "Salario mínimo (SMI)": "Minimum wage (SMI)", "anual": "annual",
    "INE": "INE",
    # precios
    "IPC": "CPI", "IPCA": "HICP", "Índice general": "General index",
    "Alimentos y bebidas no alcohólicas": "Food and non-alcoholic beverages",
    "Vivienda agua electricidad gas y otros combustibles": "Housing, water, electricity, gas and other fuels",
    "Transporte": "Transport", "Restaurantes y hoteles": "Restaurants and hotels",
    "Bebidas alcohólicas y tabaco": "Alcoholic beverages and tobacco", "Vestido y calzado": "Clothing and footwear",
    "Mobiliario y equipamiento del hogar": "Furnishings and household equipment", "Sanidad": "Health",
    "Ocio y cultura": "Recreation and culture", "Educación": "Education", "Bienes y servicios diversos": "Miscellaneous goods and services",
    # PIB
    "PIB": "GDP", "precios corrientes": "current prices", "crecimiento real": "real growth", "crecimiento nominal": "nominal growth",
    "PIB por habitante": "GDP per capita", "Remuneración de los asalariados": "Compensation of employees",
    "Excedente bruto y renta mixta": "Gross operating surplus and mixed income",
    "Impuestos netos sobre producción e importaciones": "Net taxes on production and imports",
    "Ocupados (Contabilidad Nacional)": "Employed persons (National Accounts)",
    "Horas trabajadas (Contabilidad Nacional)": "Hours worked (National Accounts)",
    "Deflactor del PIB": "GDP deflator", "variación anual": "annual change",
    # vivienda
    "Precio de la vivienda": "House price", "vivienda nueva": "new housing", "segunda mano": "second-hand housing",
    "Precio del alquiler": "Rent price", "vivienda unifamiliar": "detached housing", "vivienda colectiva (pisos)": "flats",
    "Valor tasado de la vivienda libre": "Appraised value of free-market housing",
    "Años de salario medio para comprar una vivienda de 80 m² (a precio de tasación)": "Years of mean wage to buy an 80 m² home (at appraisal price)",
    "Años de salario mediano para comprar una vivienda de 80 m² (a precio de tasación)": "Years of median wage to buy an 80 m² home (at appraisal price)",
    "Años de renta bruta del hogar para comprar una vivienda": "Years of gross household income to buy a home",
    "Esfuerzo teórico anual para pagar la hipoteca": "Theoretical annual effort to pay the mortgage",
    "Alquiler medio de un piso": "Average flat rent", "Alquiler medio por m² de un piso": "Average flat rent per m²",
    # población y empleo
    "Población": "Population", "Madrid como % de España": "Madrid as % of Spain",
    "Tasa de paro": "Unemployment rate", "Tasa de empleo": "Employment rate", "Tasa de actividad": "Activity rate",
    "todas las edades": "all ages", "menores de 25": "under 25", "25 y más": "25 and over", "55 y más": "55 and over",
    "16 a 19 años": "16 to 19 years", "20 a 24 años": "20 to 24 years", "25 a 54 años": "25 to 54 years",
    "menos de 20 años": "under 20 years", "menos de 25 años": "under 25 years", "65 y más años": "65 and over", "55 y más años": "55 and over",
    # sectores (CNAE) y ocupaciones (CNO)
    "Industrias extractivas": "Mining and quarrying", "Industria manufacturera": "Manufacturing",
    "Energía eléctrica gas vapor aire acond.": "Electricity, gas, steam and air conditioning", "Agua saneamiento residuos": "Water, sanitation and waste",
    "Construcción": "Construction", "Comercio": "Trade", "Transporte y almacenamiento": "Transport and storage", "Hostelería": "Hospitality",
    "Información y comunicaciones": "Information and communications", "Financieras y seguros": "Finance and insurance", "Inmobiliarias": "Real estate",
    "Profesionales científicas y técnicas": "Professional, scientific and technical", "Administrativas y auxiliares": "Administrative and support services",
    "Administración pública y defensa": "Public administration and defence", "Sanitarias y servicios sociales": "Health and social services",
    "Artísticas recreativas y entretenimiento": "Arts, recreation and entertainment", "Otros servicios": "Other services",
    "Directores y gerentes": "Managers",
    "Técnicos y profesionales científicos e intelectuales de salud y enseñanza": "Health and teaching scientific and intellectual professionals",
    "Otros técnicos y profesionales científicos e intelectuales": "Other scientific and intellectual technicians and professionals",
    "Técnicos y profesionales de apoyo": "Associate technicians and support professionals",
    "Empleados de oficina que no atienden al público": "Office clerks who do not serve the public",
    "Empleados de oficina que atienden al público": "Office clerks who serve the public",
    "Trabajadores de restauración y comercio": "Catering and retail workers",
    "Trabajadores de servicios de salud y cuidado de personas": "Health and personal-care workers",
    "Trabajadores de servicios de protección y seguridad": "Protection and security workers",
    "Trabajadores cualificados agrícolas ganaderos forestales y pesqueros": "Skilled agricultural, livestock, forestry and fishing workers",
    "Cualificados de la construcción (excepto operadores)": "Skilled construction workers (excluding operators)",
    "Cualificados de industrias manufactureras (excepto operadores)": "Skilled manufacturing workers (excluding operators)",
    "Operadores de instalaciones y maquinaria fijas y montadores": "Plant and fixed machinery operators and assemblers",
    "Conductores y operadores de maquinaria móvil": "Drivers and mobile machinery operators",
    "No cualificados en servicios (excepto transportes)": "Unskilled service workers (excluding transport)",
    "Peones de agricultura pesca construcción industria y transportes": "Labourers in agriculture, fishing, construction, industry and transport",
    "Indefinido": "Permanent", "Temporal": "Fixed-term",
    # desigualdad
    "Índice de Gini (salario)": "Gini index (wages)",
    "% trabajadores con ganancia baja (low pay rate)": "% of workers with low pay (low pay rate)",
    "% de mujeres en el total de asalariados con ganancia baja": "% of women among all employees with low pay",
    "D9/D5 (decil 9 / mediana ganancia por hora)": "D9/D5 (decile 9 / median hourly earnings)",
    "D5/D1 (mediana / decil 1 ganancia por hora)": "D5/D1 (median / decile 1 hourly earnings)",
    "D9/D1 (decil 9 / decil 1 ganancia por hora)": "D9/D1 (decile 9 / decile 1 hourly earnings)",
    # gasto de los hogares
    "Gasto por hogar": "Spending per household", "Gasto por persona": "Spending per person", "Peso en el gasto": "Share of spending",
    "Muebles y artículos del hogar": "Furniture and household items", "Comunicaciones": "Communications", "Enseñanza": "Education",
    "Otros bienes y servicios": "Other goods and services",
    # renta y pobreza
    "Renta neta media por persona": "Mean net income per person", "Renta neta media por unidad de consumo": "Mean net income per consumption unit",
    "Renta neta media por persona, con alquiler imputado": "Mean net income per person, with imputed rent",
    "Renta neta media por unidad de consumo, con alquiler imputado": "Mean net income per consumption unit, with imputed rent",
    "AROPE: riesgo de pobreza o exclusión social": "AROPE: at risk of poverty or social exclusion",
    "Riesgo de pobreza": "At risk of poverty", "Carencia material y social severa": "Severe material and social deprivation",
    "Baja intensidad en el trabajo (0-64 años)": "Low work intensity (ages 0–64)",
    # educación
    "Gasto público en educación": "Public spending on education", "% del PIB": "% of GDP",
}


def _num_range(a, b):
    return f"{a} to {b}"


# (expresión regular, función que devuelve el inglés)
RULES = [
    (re.compile(r"^(\d+) a (\d+) años$"), lambda m: f"{m.group(1)} to {m.group(2)} years"),
    (re.compile(r"^(\d+) y más años$"), lambda m: f"{m.group(1)} and over"),
    (re.compile(r"^% trabajadores( a tiempo completo)? con salario (\S+) SMI(?: \((mujeres|hombres)\))?$"),
     lambda m: "% of " + ("full-time " if m.group(1) else "") + f"workers with pay {m.group(2)} SMI"
     + ({None: "", "mujeres": " (women)", "hombres": " (men)"}[m.group(3)])),
]


def translate_part(p):
    if p in PARTS:
        return PARTS[p]
    for rx, fn in RULES:
        m = rx.match(p)
        if m:
            return fn(m)
    raise KeyError(p)
