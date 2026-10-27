"""Plantillas de las descripciones, lecturas, avisos y notas del catálogo.

Clave: el texto en español con los datos variables sustituidos por {0}, {1}… (en orden de aparición;
véase `web_en.tokenize`). Valor: el inglés, que puede omitir o reordenar esos marcadores.
"""

TEMPLATES = {
    "Suma de {0} los salarios brutos anuales dividida entre el número de asalariados. Euros brutos al año por trabajador asalariado ({1}, {2}).":
        "Sum of all gross annual wages divided by the number of employees. Gross euros per year per employee ({1}, {2}).",
    "Salario por debajo del cual está el 10 % de los asalariados. Euros brutos al año por trabajador asalariado ({0}, {1}).":
        "Wage below which 10% of employees fall. Gross euros per year per employee ({0}, {1}).",
    "Salario por debajo del cual está el 25 % de los asalariados. Euros brutos al año por trabajador asalariado ({0}, {1}).":
        "Wage below which 25% of employees fall. Gross euros per year per employee ({0}, {1}).",
    "Salario del trabajador «de en medio»: la mitad cobra menos y la otra mitad más. Euros brutos al año por trabajador asalariado ({0}, {1}).":
        "Wage of the “middle” worker: half earn less and the other half earn more. Gross euros per year per employee ({0}, {1}).",
    "Salario por debajo del cual está el 75 % de los asalariados. Euros brutos al año por trabajador asalariado ({0}, {1}).":
        "Wage below which 75% of employees fall. Gross euros per year per employee ({0}, {1}).",
    "Salario por debajo del cual está el 90 % de los asalariados. Euros brutos al año por trabajador asalariado ({0}, {1}).":
        "Wage below which 90% of employees fall. Gross euros per year per employee ({0}, {1}).",
    "Suma de todos los salarios brutos anuales dividida entre el número de asalariados. Euros brutos al año por trabajador asalariado ({0}, {1}).":
        "Sum of all gross annual wages divided by the number of employees. Gross euros per year per employee ({0}, {1}).",
    "Salario mínimo interprofesional fijado por el Gobierno, en euros brutos al año (mensualidad × 14 pagas).":
        "Statutory minimum wage (SMI) set by the Government, in gross euros per year (monthly amount × 14 payments).",
    "Cuánto subieron los precios de los bienes y servicios que consumen las familias ({0}), medido de diciembre a diciembre.":
        "How much the prices of the goods and services households consume rose ({0}), measured from December to December.",
    "Variación media anual de los precios del grupo «{0}» en {1}, con la metodología armonizada europea ({2}).":
        "Average annual change in the prices of the group “{0}” in {1}, using the harmonised European methodology ({2}).",
    "Valor de todo lo que produce {0} en un año, a los precios de ese año, en millones de euros.":
        "Value of everything {0} produces in a year, at that year’s prices, in millions of euros.",
    "Cuánto crece la producción de {0} en volumen: es decir, descontando la subida de precios.":
        "How much {0}’s output grows in volume: that is, after discounting price rises.",
    "Cuánto crece el {0} a precios corrientes: mezcla crecimiento real y subida de precios.":
        "How much {0} grows at current prices: a mix of real growth and price rises.",
    "Índice de Precios de Vivienda del INE ({0}, {1}): cómo evoluciona el precio de compraventa, media anual, base 2025 = 100.":
        "INE House Price Index ({0}, {1}): how the purchase price evolves, annual average, base 2025 = 100.",
    "Índice de Precios de Vivienda en Alquiler del INE ({0}, {1}), media anual, base 2015 = 100.":
        "INE Rental Housing Price Index ({0}, {1}), annual average, base 2015 = 100.",
    "Euros por metro cuadrado de la vivienda libre según las tasaciones hipotecarias (media de los cuatro trimestres, total nacional).":
        "Euros per square metre of free-market housing according to mortgage appraisals (average of the four quarters, national total).",
    "Cuántos años de salario medio bruto (INE) harían falta para pagar una vivienda tipo de 80 m² al valor tasado medio de ese año, sin hipoteca ni gastos.":
        "How many years of mean gross wage (INE) it would take to pay for a typical 80 m² home at that year’s average appraised value, with no mortgage or costs.",
    "Cuántos años de salario mediano bruto (INE) harían falta para pagar una vivienda tipo de 80 m² al valor tasado medio de ese año, sin hipoteca ni gastos.":
        "How many years of median gross wage (INE) it would take to pay for a typical 80 m² home at that year’s average appraised value, with no mortgage or costs.",
    "Indicador de accesibilidad a la vivienda del {0} (media de cada año). Sólo hay 2023, 2024 y 2025 en la tabla pública que hemos podido leer.":
        "Housing affordability indicator from the {0} (average of each year). Only 2023, 2024 and 2025 are in the public table we could read.",
    "Alquiler medio de los pisos con contrato declarado, en euros al mes, de 2013 a 2024.":
        "Average rent of flats with a declared contract, in euros per month, from 2013 to 2024.",
    "Alquiler medio de los pisos con contrato declarado, en euros por metro cuadrado y mes, de 2013 a 2024.":
        "Average rent of flats with a declared contract, in euros per square metre per month, from 2013 to 2024.",
    "Personas residentes en {0} a 1 de enero de cada año ({1}).":
        "People resident in {0} on 1 January of each year ({1}).",
    "Qué porcentaje de los residentes en España vive en la {0}.":
        "What percentage of Spain’s residents live in the {0}.",
    "El PIB a {0} repartido entre los residentes: una forma de ver el PIB «por persona».":
        "GDP at {0} divided among residents: a way of seeing GDP “per person”.",
    "Porcentaje de la población activa que no tiene empleo y lo busca ({0}, {1}, {2}). Media anual.":
        "Percentage of the labour force that has no job and is looking for one ({0}, {1}, {2}). Annual average.",
    "Porcentaje de la población de 16 y más años que tiene empleo. {0}, {1}. Media anual.":
        "Percentage of the population aged 16 and over that has a job. {0}, {1}. Annual average.",
    "Porcentaje de la población de 16 y más años que trabaja o busca trabajo. {0}, {1}. Media anual.":
        "Percentage of the population aged 16 and over that works or is looking for work. {0}, {1}. Annual average.",
    "{0} bruto anual de los asalariados de {1} ({2}, {3}).":
        "{0}: gross annual pay of employees aged {1} ({2}, {3}).",
    "{0} bruto anual de los asalariados según su sector de actividad: «{1}» ({2}).":
        "{0}: gross annual pay of employees by sector of activity: “{1}” ({2}).",
    "{0} bruto anual de los asalariados según su ocupación: «{1}» ({2}).":
        "{0}: gross annual pay of employees by occupation: “{1}” ({2}).",
    "{0} bruto anual de los asalariados según su tipo de contrato: «{1}» ({2}).":
        "{0}: gross annual pay of employees by type of contract: “{1}” ({2}).",
    "{0}. {1}, {2}.":
        "{0}. {1}, {2}.",
    "{0} en «{1}» ({2}), según la Encuesta de Presupuestos Familiares.":
        "{0} on “{1}” ({2}), according to the Household Budget Survey.",
    "Renta neta media anual por persona ({0}): lo que queda a los hogares tras impuestos y cotizaciones.":
        "Mean annual net income per person ({0}): what is left to households after taxes and contributions.",
    "Renta neta media anual por unidad de consumo ({0}): lo que queda a los hogares tras impuestos y cotizaciones.":
        "Mean annual net income per consumption unit ({0}): what is left to households after taxes and contributions.",
    "Renta neta media anual por persona, con alquiler imputado ({0}): lo que queda a los hogares tras impuestos y cotizaciones.":
        "Mean annual net income per person, with imputed rent ({0}): what is left to households after taxes and contributions.",
    "Renta neta media anual por unidad de consumo, con alquiler imputado ({0}): lo que queda a los hogares tras impuestos y cotizaciones.":
        "Mean annual net income per consumption unit, with imputed rent ({0}): what is left to households after taxes and contributions.",
    "{0} ({1}): porcentaje de la población en esta situación.":
        "{0} ({1}): percentage of the population in this situation.",
    "{0} publicado por el {1}.":
        "{0} published by {1}.",
    "Todo lo que se paga a los asalariados (sueldos y cotizaciones sociales de la empresa), en millones de euros.":
        "Everything paid to employees (wages and the employer’s social contributions), in millions of euros.",
    "Lo que queda a empresas y autónomos tras pagar salarios, en millones de euros.":
        "What is left to companies and the self-employed after paying wages, in millions of euros.",
    "Impuestos como el IVA menos subvenciones, en millones de euros.":
        "Taxes such as VAT minus subsidies, in millions of euros.",
    "Personas con empleo según la Contabilidad Nacional, en miles.":
        "People in employment according to the National Accounts, in thousands.",
    "Total de horas trabajadas en el año, en miles.":
        "Total hours worked in the year, in thousands.",
    "Cuánto suben los precios de todo lo que produce el país (no solo de lo que consumen las familias).":
        "How much the prices of everything the country produces rise (not only of what households consume).",
    "Lo que gastan todas las administraciones en educación, en millones de euros.":
        "What all public administrations spend on education, in millions of euros.",
    "El gasto público en educación como porcentaje del PIB.":
        "Public spending on education as a percentage of GDP.",
    "Los sueldos muy altos la empujan al alza, por eso casi siempre es mayor que la mediana.":
        "High wages push it up, so it is almost always higher than the median.",
    "Describe la parte baja de la escala: nueve de cada diez cobran más.":
        "Describes the low end of the scale: nine out of ten earn more.",
    "Tres de cada cuatro asalariados cobran más que esta cifra.":
        "Three out of four employees earn more than this figure.",
    "Es la mejor aproximación al sueldo «típico»; la media la suele superar.":
        "The best approximation to the “typical” wage; the mean usually exceeds it.",
    "Solo uno de cada cuatro asalariados cobra más que esta cifra.":
        "Only one in four employees earns more than this figure.",
    "Solo uno de cada diez cobra más: marca la entrada a los salarios altos.":
        "Only one in ten earns more: it marks the entry to high wages.",
    "Es el suelo legal para una jornada completa. Compáralo con la mediana para ver cuánto se acerca el suelo al sueldo típico.":
        "This is the legal floor for a full-time job. Compare it with the median to see how close the floor is to the typical wage.",
    "Un +3 % significa que la misma cesta de la compra cuesta un 3 % más que hace un año. Un valor negativo es deflación.":
        "A +3% means the same shopping basket costs 3% more than a year ago. A negative value is deflation.",
    "Sirve para ver qué parte de la cesta tira de la inflación: alimentos y vivienda pesan mucho en el gasto de las familias.":
        "Use it to see which part of the basket is driving inflation: food and housing weigh heavily in family spending.",
    "Sube tanto si se produce más como si suben los precios: por eso no basta para saber si la economía crece de verdad.":
        "It rises both when more is produced and when prices rise, so it is not enough to tell whether the economy is really growing.",
    "Es el dato de «crecimiento económico» de las noticias. Dos años seguidos en negativo se suele llamar recesión.":
        "This is the “economic growth” figure in the news. Two years in a row of negative values are usually called a recession.",
    "Si es mucho mayor que el crecimiento real, buena parte de lo que «crece» es inflación.":
        "If it is much higher than real growth, a good part of what “grows” is inflation.",
    "Sube cuando las viviendas se venden más caras. Compáralo con el salario y con el IPC para ver si la vivienda se encarece más que el sueldo.":
        "It rises when homes sell for more. Compare it with wages and the CPI to see whether housing is getting more expensive than pay.",
    "Mide cómo cambia la renta de los alquileres. Incluye contratos antiguos, así que sube menos que los alquileres que se firman hoy.":
        "Measures how rents change. It includes old contracts, so it rises less than rents signed today.",
    "Es el precio por m² que valoran las tasadoras, no el de la compraventa ni el de los anuncios. Sirve para ver la tendencia de largo plazo (1995–2025).":
        "It is the price per m² that appraisers assign, not the sale price or the advertised price. Useful for seeing the long-term trend (1995–2025).",
    "Cuanto más alto, más difícil es comprar con un sueldo. Compara la burbuja de 2007–2008 con el mínimo de 2013–2015 y el repunte reciente.":
        "The higher it is, the harder it is to buy with one wage. Compare the 2007–2008 bubble with the 2013–2015 low and the recent rebound.",
    "Es la medida oficial: cuántos años de renta bruta de un hogar equivale el precio de una vivienda. Sale más alta que la nuestra porque usa precios de mercado, no de tasación.":
        "This is the official measure: how many years of a household’s gross income a home costs. It comes out higher than ours because it uses market prices, not appraisals.",
    "Porcentaje de la renta del hogar que se iría cada año en la cuota de una hipoteca para comprar una vivienda. El {0} suele marcar el 30–35 % como zona de riesgo.":
        "Percentage of household income that would go each year on mortgage payments to buy a home. The {0} usually marks 30–35% as a risk zone.",
    "Sube mucho menos que los anuncios actuales: incluye contratos antiguos que se actualizan poco. Para el alquiler que piden hoy, mira los precios de oferta (Idealista) del libro de vivienda.":
        "It rises much less than current adverts: it includes old contracts that are rarely updated. For the rent being asked today, see the offer prices (Idealista) in the housing book.",
    "Es el denominador de casi todo: dividir entre la población convierte totales (PIB, gasto) en cifras por persona.":
        "It is the denominator of almost everything: dividing by population turns totals (GDP, spending) into per-person figures.",
    "Si sube, {0} crece más deprisa que el conjunto del país.":
        "If it rises, {0} is growing faster than the country as a whole.",
    "Quita el efecto de que haya más gente. Sigue incluyendo la subida de precios; para quitarla, mira su índice frente al IPC.":
        "It removes the effect of there being more people. It still includes price rises; to remove them, look at its index against the CPI.",
    "Es el «paro» de las noticias de la EPA. Sube en las crisis (el máximo fue en 2013) y es mucho mayor entre los jóvenes.":
        "This is the “unemployment” in the news from the EPA. It rises in crises (the peak was in 2013) and is much higher among young people.",
    "Sube cuando hay más gente trabajando en relación con la población en edad de trabajar.":
        "It rises when more people are working relative to the working-age population.",
    "Mide cuánta gente participa en el mercado laboral, tenga o no empleo.":
        "Measures how many people take part in the labour market, whether or not they have a job.",
    "Muestra cómo cambia el sueldo a lo largo de la vida laboral y si los jóvenes han mejorado menos que los mayores.":
        "Shows how pay changes over a working life and whether young people have improved less than older ones.",
    "Compáralo con el salario medio de {0} para ver qué sectores u ocupaciones cobran por encima o por debajo.":
        "Compare it with the mean wage for {0} to see which sectors or occupations earn above or below it.",
    "Mide cómo se reparten los salarios. Si el Gini o los cocientes suben, la desigualdad aumenta.":
        "Measures how wages are distributed. If the Gini or the ratios rise, inequality is increasing.",
    "Reparte a los asalariados según cuántas veces el salario mínimo cobran. Una tasa alta en «0-1 SMI» indica mucho empleo mal pagado.":
        "Distributes employees by how many times the minimum wage they earn. A high rate in “0-1 SMI” indicates a lot of low-paid work.",
    "Euros que gasta de media cada hogar (o persona) al año en este grupo.":
        "Euros that each household (or person) spends on average per year on this group.",
    "Muestra en qué se va el dinero de las familias. Vivienda, alimentos y transporte suelen sumar más de la mitad.":
        "Shows where families’ money goes. Housing, food and transport usually add up to more than half.",
    "Es renta del hogar (no solo salario). Se refiere al año anterior al de la encuesta.":
        "This is household income (not only wages). It refers to the year before the survey.",
    "Es una medida de pobreza relativa: depende de cómo vive el resto del país, no de un mínimo absoluto.":
        "It is a measure of relative poverty: it depends on how the rest of the country lives, not on an absolute minimum.",
    "Compáralo con nuestro cálculo (PIB ÷ población a 1 de enero), que usa otra población.":
        "Compare it with our calculation (GDP ÷ population on 1 January), which uses a different population.",
    "Es la parte del PIB que va al trabajo. Dividida entre el PIB da la «parte salarial».":
        "This is the share of GDP that goes to labour. Divided by GDP it gives the “wage share”.",
    "Es la parte del PIB que va al capital y a los autónomos.":
        "This is the share of GDP that goes to capital and the self-employed.",
    "Es la parte del PIB que recauda el Estado por producir y consumir.":
        "This is the share of GDP that the State collects for producing and consuming.",
    "No coincide con la EPA: usa otra metodología.":
        "It does not match the EPA: it uses a different methodology.",
    "Dividir el PIB entre las horas da la productividad por hora.":
        "Dividing GDP by hours gives productivity per hour.",
    "Es otra forma de medir la inflación: sirve para pasar del PIB nominal al real.":
        "This is another way of measuring inflation: it is used to go from nominal to real GDP.",
    "Compáralo con el PIB para ver si la educación pesa más o menos que antes.":
        "Compare it with GDP to see whether education weighs more or less than before.",
    "Un valor más alto significa que el país destina una parte mayor de lo que produce a educación.":
        "A higher value means the country devotes a larger share of what it produces to education.",
    "Es la ganancia bruta anual por trabajador: no equivale a un salario por hora ni de jornada completa.":
        "It is gross annual earnings per worker: it is not equivalent to an hourly wage or to a full-time wage.",
    "Las cifras de 2004 a 2017 vienen de memoria y no están contrastadas con el BOE; 2018–2026 sí.":
        "The figures for 2004 to 2017 are from memory and have not been checked against the BOE (official state gazette); 2018–2026 have.",
    "Mide diciembre sobre diciembre, no la media del año: comparado con un salario medio anual es una aproximación.":
        "It measures December on December, not the average for the year: compared with an annual average wage it is an approximation.",
    "Es la tasa media anual armonizada: no coincide con el IPC de diciembre sobre diciembre del INE.":
        "It is the harmonised annual average rate: it does not match INE’s December-on-December CPI.",
    "Hay un pequeño salto en 2022→2023 porque cambia la fuente y la revisión estadística. 2023–2025 son provisionales o avance.":
        "There is a small jump in 2022→2023 because the source and the statistical revision change. 2023–2025 are provisional or advance estimates.",
    "2023–2025 provisional o avance; pueden revisarse.":
        "2023–2025 provisional or advance estimates; they may be revised.",
    "Es un índice de precios de compraventa, no euros por m². Media anual, frente al IPC de diciembre sobre diciembre.":
        "It is a price index of purchases and sales, not euros per m². Annual average, against the December-on-December CPI.",
    "Se calcula con datos tributarios de todos los contratos vivos: suaviza las subidas de los alquileres nuevos. Último año: 2024.":
        "It is calculated from tax data on all live contracts: it smooths out the rises of new rents. Last year: 2024.",
    "Fuente secundaria (ICANE). Es valor de tasación: suele quedar por debajo del precio de oferta de los anuncios.":
        "Secondary source (ICANE). It is an appraised value: it is usually below the asking price of adverts.",
    "Es una cota baja: usa el valor de tasación (que va por debajo del precio de compraventa y del de los anuncios), una vivienda de 80 m² y el salario bruto de una sola persona, y supone ahorrar el 100 % del sueldo. La cifra oficial del {0} (7,1 años en 2024, 7,6 en 2025) y la de la prensa (7–8) usan precios de mercado.":
        "It is a low estimate: it uses the appraised value (which is below the sale price and the advertised price), an 80 m² home and the gross pay of one person, and assumes saving 100% of the wage. The official figure from the {0} (7.1 years in 2024, 7.6 in 2025) and the press figure (7–8) use market prices.",
    "Sólo tres años (2023–2025). En el segundo trimestre de 2026 llega a 8,4 años y 38,0 %, que no se incluye por ser un trimestre.":
        "Only three years (2023–2025). In the second quarter of 2026 it reaches 8.4 years and 38.0%, which is not included because it is a single quarter.",
    "Es un cálculo nuestro, no una estadística publicada. Mide contratos en vigor (no los nuevos) y llega hasta 2024.":
        "This is our own calculation, not a published statistic. It measures contracts in force (not new ones) and runs to 2024.",
    "Es un cálculo nuestro, no una estadística publicada. Mide contratos en vigor (no los nuevos) y llega hasta 2024. El total nacional no lo publica el Ministerio: es nuestra media de 17 CCAA, sin Navarra ni País Vasco.":
        "This is our own calculation, not a published statistic. It measures contracts in force (not new ones) and runs to 2024. The national total is not published by the Ministry: it is our average of 17 regions, excluding Navarre and the Basque Country.",
    "Dato a 1 de enero (2026 provisional). Madrid es la {0}. Las cifras de {1} de 2003 a 2012 son estimaciones del INE.":
        "Figure at 1 January (2026 provisional). Madrid is the {0}. Spain’s figures from 2003 to 2012 are INE estimates.",
    "Dato a 1 de enero (2026 provisional). {0} es la {1}, no el municipio.":
        "Figure at 1 January (2026 provisional). {0} is the {1}, not the municipality.",
    "No coincide exactamente con el {0} que publica el INE (usa población media anual).":
        "It does not exactly match the {0} published by INE (which uses the annual average population).",
    "En índice o variación el cambio es relativo (de un 8 % a un 10 % es +25 %), no en puntos porcentuales. Ver en «brutos» para leer los puntos.":
        "In index or change terms the change is relative (from 8% to 10% is +25%), not in percentage points. See it in “gross” to read the points.",
    "En índice o variación el cambio es relativo, no en puntos porcentuales.":
        "In index or change terms the change is relative, not in percentage points.",
    "Salario bruto anual medio. En los tramos con pocos trabajadores el INE avisa de muestra pequeña (100–500 observaciones): úsalo con cautela.":
        "Mean gross annual pay. For bands with few workers INE warns of a small sample (100–500 observations): use with caution.",
    "Salario bruto anual medio, solo {0}. Sector según CNAE-09, ocupación según CNO-11; no incluye agricultura.":
        "Mean gross annual pay, {0} only. Sector according to CNAE-09, occupation according to CNO-11; agriculture is not included.",
    "En índice o variación el cambio es relativo, no en puntos.":
        "In index or change terms the change is relative, not in points.",
    "Ruptura metodológica entre 2018 y 2019 en los tramos de SMI: no compares tasas de antes y después sin cautela. En índice o variación el cambio es relativo, no en puntos.":
        "Methodological break between 2018 and 2019 in the SMI bands: do not compare rates before and after without caution. In index or change terms the change is relative, not in points.",
    "Importes nominales (sin quitar la inflación). Último año publicado: 2023. Grupos ECOICOP v1, que no coinciden con los 14 del IPC de 2026.":
        "Nominal amounts (inflation not removed). Last year published: 2023. ECOICOP v1 groups, which do not match the 14 of the 2026 CPI.",
    "Importes nominales (sin quitar la inflación). Último año publicado: 2023. Grupos ECOICOP v1, que no coinciden con los 14 del IPC de 2026. {0} es la {1}.":
        "Nominal amounts (inflation not removed). Last year published: 2023. ECOICOP v1 groups, which do not match the 14 of the 2026 CPI. {0} is the {1}.",
    "Solo 3 años (2023–2025). El año es el de la encuesta; la renta es del año anterior.":
        "Only 3 years (2023–2025). The year is the survey year; the income is from the previous year.",
    "Solo 2023–2025: 2023 definitivo o provisional, 2024 provisional, 2025 avance. Pueden revisarse.":
        "Only 2023–2025: 2023 final or provisional, 2024 provisional, 2025 advance estimate. They may be revised.",
    "Solo 2024 y 2025 (provisional y avance).":
        "Only 2024 and 2025 (provisional and advance estimate).",
    "Serie desde 2019: el dato de 2014 (44.789 M€) no se incluye porque faltan 2015–2018 y la línea uniría ambos años sin datos. Cifra oficial leída en un informe de prensa (fuente secundaria): contrastar. 2024 es avance.":
        "Series since 2019: the 2014 figure (€44,789M) is not included because 2015–2018 are missing and the line would join both years with no data. Official figure read in a press report (secondary source): to be checked. 2024 is an advance estimate.",
    "Fuente secundaria: contrastar. 2024 es avance. En índice o variación el cambio es relativo, no en puntos.":
        "Secondary source: to be checked. 2024 is an advance estimate. In index or change terms the change is relative, not in points.",
    "Para 1996–2022 la variación se calcula dividiendo el {0} de cada año entre el del año anterior; 2023–2025 la publica el INE.":
        "For 1996–2022 the change is calculated by dividing each year’s {0} by the previous year’s; 2023–2025 is published by INE.",
    "80 m² × valor tasado (€/m², media anual) ÷ salario medio bruto anual por asalariado. Los salarios del INE empiezan en 2008.":
        "80 m² × appraised value (€/m², annual average) ÷ mean gross annual wage per employee. INE wages start in 2008.",
    "80 m² × valor tasado (€/m², media anual) ÷ salario mediano bruto anual por asalariado. Los salarios del INE empiezan en 2008.":
        "80 m² × appraised value (€/m², annual average) ÷ median gross annual wage per employee. INE wages start in 2008.",
    "{0} de {1} ÷ población de España × 100, a 1 de enero de cada año.":
        "{0} of {1} ÷ population of Spain × 100, on 1 January of each year.",
    "PIB a {0} (millones de €) × 1.000.000 ÷ población a 1 de enero. El INE usa la población media del año, así que su cifra oficial difiere unas décimas.":
        "GDP at {0} (millions of €) × 1,000,000 ÷ population on 1 January. INE uses the average population of the year, so its official figure differs by a few tenths.",
    "Media de las cuatro tasas trimestrales de cada año (el INE publica la tasa trimestral). Solo se calcula si hay los 4 trimestres.":
        "Mean of the four quarterly rates of each year (INE publishes the quarterly rate). Only calculated if all 4 quarters are available.",
}
