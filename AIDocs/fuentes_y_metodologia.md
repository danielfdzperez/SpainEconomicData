# Fuentes y metodología

## Fuentes (todas públicas y gratuitas)
| Organismo | Qué se usó | Acceso |
|---|---|---|
| INE (Tempus3) | EPA, EES/EAES (salarios), IPC, EPF, ECV, IPV, IPVA, IRAV | API `https://servicios.ine.es/wstempus/js/ES/` |
| Eurostat | EU-LFS regional (NUTS2), IPC armonizado (HICP) | API de difusión `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/` |
| Agencia Tributaria | Distribución del salario por centiles (2024) | Estadísticas web (HTML) |
| Seguridad Social / SEPE | Paro registrado, contratos, prestaciones (nota mensual) | Revista Seguridad Social |
| Comunidad de Madrid (iEstadis) | Boletines de paro, afiliación y vivienda (PDF) | `gestiona3.madrid.org/iestadis/...` |
| Ministerio de Vivienda | Valor tasado (vía boletín), SERPAVI alquiler 2022 | PDF de tablas resumen |
| BOE / Ministerio de Trabajo | Salario Mínimo Interprofesional | normativa |
| Idealista (sala de prensa) | Precios de oferta de alquiler y venta por CCAA, provincia, municipio y distrito de Madrid (últimos 12 meses) | Informes HTML públicos (ver patrón abajo) |
| INE (ECP, IDB, proyecciones) | Población por edad, sexo, nacionalidad y CCAA; histórico desde 1971; indicadores demográficos; proyecciones 2026–2076 | API Tempus3 y notas de prensa |
| Ayuntamiento de Madrid | Padrón de la ciudad (1-ene-2026), «Primeros resultados» | Nota de prensa/PDF |

El detalle de tabla, URL y observaciones está en la hoja `FUENTES` de cada libro.

## Patrones de la API del INE
- `DATOS_TABLA/{id}?nult=N&tip=A` devuelve las últimas N observaciones con nombres legibles (`tip=A`); `DATOS_SERIE/{COD}`; `SERIES_TABLA/{id}`; `GRUPOS_TABLA/{id}` y `VALORES_GRUPOSTABLA/{id}/{grupo}` para conocer los filtros.
- Filtros `tv=variable:valor`. Territorio: `tv=70:9009` = Comunidad de Madrid (variable 70 = CCAA); `tv=349:16473` = Total Nacional (variable 349). Sexo: `18:454` ambos, `18:452` hombres, `18:453` mujeres. Un filtro por variable (repetir el mismo no funciona).
- Periodicidad: 1 mensual, 3 trimestral, 12 anual. En fechas, abril = 2.º trimestre (hora de Madrid).
- Códigos útiles: EPA 65302 ocupados, 65332 parados, 65285 población, 79325 sectores CNAE-2025, 74999 paro anual por sexo y edad; EES 28191 distribución, 28189/28201 edad, 28184 desigualdad, 28182 tramos SMI; IPC 76136 (CCAA/grupos), 76134 y 76140 (general); EPF 14505; ECV 49145 y 76847; IPV 80270/80271; IPVA 59056; IRAV 72975.

## Población (INE)
- Operación 450 = ECP (`TABLAS_OPERACION/450`), operación 33 = Indicadores Demográficos Básicos (IDB).
- Tabla 59587: CCAA × grupo quinquenal de edad × nacionalidad × sexo, trimestral (último 1-jul-2026, provisional). Los filtros de sexo y nacionalidad no se aplicaron en la respuesta resumida, y la petición completa se trunca: se descargó **una CCAA por petición** (`tv=70:{id CCAA}`) con `nult=1`; «Todas las edades» con `tv=356:15668`. Se validó que la suma de grupos y de CCAA coincide con España.
- Series largas: `DATOS_SERIE/ECP320` (España total), `ECP319` (hombres), `ECP115490` (Madrid total), `ECP113551` (Madrid hombres), con `nult=400`. Tablas 56934/56940/56945 (desde 1971, a 1-ene) y 59583/59238/59589 (otras desagregaciones); 60132 = personas por hogar; 60131 = hogares por tamaño (sin cargar).
- IDB: nota de prensa `https://www.ine.es/uc/6tBC03TH` (datos 2024, publicados 19-nov-2025) más tablas Tempus. Proyecciones: `https://www.ine.es/dyngs/Prensa/PROP20262076.pdf` (17-jun-2026).

## Idealista (sala de prensa)
- Patrón: `https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/{alquiler|venta}/{ccaa}/{provincia}/{municipio}/`. Madrid ciudad: `.../madrid-comunidad/madrid-provincia/madrid/`.
- Slugs de CCAA: andalucia, aragon, asturias, baleares, canarias, cantabria, castilla-y-leon, castilla-la-mancha, cataluna, comunitat-valenciana, euskadi, extremadura, galicia, la-rioja, madrid-comunidad, melilla, murcia-region, navarra.
- Se leen con WebFetch (páginas públicas). Cada informe solo muestra los últimos 12 meses; los valores son precios de **oferta**. Los datos de sep-2026 están en el libro 04; para actualizar, repetir las lecturas y reconstruir las hojas `Idealista_*`.

## Limitaciones técnicas del entorno de trabajo
- La consola no llega a las webs estadísticas (HTTP 403 del proxy): se leyó con WebFetch, cuyo resumidor **trunca respuestas largas** y a veces falla en listas largas. Por eso las descargas se hicieron con filtros y por tramos, y se validaron (nº de columnas, sumas, comparación con notas de prensa).
- Eurostat limitó las peticiones (HTTP 429): faltó el grupo CP08 del HICP.
- Tablas de la AEAT y algunos boletines solo están en HTML/PDF: transcritos manualmente.
- Algunas descargas (SERPAVI 2011–2024 xlsx, nota de síntesis del Ministerio) estaban bloqueadas.
- `datos.madrid.es` (padrón por distrito) rechaza la lectura automática (robots): no se sorteó; la población por distrito de Madrid ciudad queda como hueco.
- Una tabla de municipios del INE (79543) devolvía datos municipales, no nacionales: se descartó.

## Convenciones del libro
- Cabecera en la fila 1 de las hojas de datos, años en columnas en orden creciente.
- Azul = dato de fuente; negro = fórmula; verde = enlace a otra hoja; naranja = muestra pequeña; amarillo = estimación no oficial.
- Salarios en euros brutos anuales; EPA en miles de personas salvo indicación; tasas en %.
- Años de IPC: tasas interanuales del INE (base 2025) y dic/dic cuando se indica.

## Registro de decisiones
- Paro registrado: se excluyeron cifras evidentemente erróneas de un boletín (paro nacional 19.517; extranjeros de Madrid 1.345).
- SMI 2004–2017 son cifras históricas no contrastadas en esta sesión (marcadas).
- Moda y desviación típica: la moda solo existe en notas de prensa (2022–2024); la desviación típica no es pública, se estima (lognormal) y se marca.
