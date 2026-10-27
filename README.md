<div align="center">

# Datos económicos de España y Madrid

**Proyecto de práctica: obtener datos económicos públicos, ordenarlos con rigor y analizarlos en una web interactiva.**

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3-3776AB?style=for-the-badge&logo=python&logoColor=white)

![Datos](https://img.shields.io/badge/datos-INE_·_Eurostat_·_AEAT_·_SS-informational)
![Pages](https://img.shields.io/badge/GitHub_Pages-estático-222?logo=github&logoColor=white)
![Estado](https://img.shields.io/badge/estado-en_desarrollo-orange)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-green)](LICENSE)
[![Built with AI assistance](https://img.shields.io/badge/Hecho_con_ayuda_de-Claude_(IA)-D97757?logo=claude&logoColor=white)](#uso-de-ia)

</div>

---

## ¿Qué es?

El objetivo del proyecto es **practicar el ciclo completo con datos económicos**: encontrar las fuentes oficiales, descargar los datos (API del INE y de Eurostat, tablas HTML y PDF), limpiarlos y documentarlos, compararlos entre España y la Comunidad de Madrid, y analizarlos.

El resultado es doble:

1. **Una base de conocimiento** de datos públicos y gratuitos: cinco libros Excel, una veintena de CSV y un documento por tema con las cifras, las definiciones y los huecos.
2. **Una web estática** (React + Vite) para explorar 390 series, leer lo que dicen los gráficos y simular cuánto pagas y qué recibes del sector público. Está en **castellano e inglés** (botón en la cabecera).

> **Regla de la casa:** todo lo que lleva `*` en la web (o color amarillo/naranja en los Excel) es un cálculo o una estimación **nuestra**, no un dato oficial. No se añade ninguna cifra sin fuente.

## Temas que cubre

| Tema | Qué incluye | Fuente principal |
|---|---|---|
| Empleo y desempleo | EPA 2002–2026, paro registrado, afiliación, sectores | INE, SEPE, Eurostat |
| Salarios | Media, mediana, percentiles, brecha de género, SMI, desigualdad | INE (EES), AEAT |
| Coste de la vida | IPC, IPC armonizado, gasto de los hogares, renta y pobreza | INE, Eurostat |
| Vivienda y alquiler | Precio de compraventa, valor tasado, alquiler, precios de oferta | INE, Ministerio de Vivienda, Idealista |
| Población | Edad, sexo, nacionalidad, CCAA, serie desde 1971, proyecciones | INE |
| Impuestos y cotizaciones | IRPF, Seguridad Social, autónomos (2026) | AEAT, BOE, Seguridad Social |
| Desempleo y pensiones | Prestaciones, duración, pensión media y máxima | SEPE, Seguridad Social |
| Sanidad, educación y transporte | Coste público frente a privado | Varias (ver `fiabilidad`) |
| PIB | Serie 1995–2025 y reparto por sectores | INE, Eurostat |

## Cómo fluyen los datos

```mermaid
flowchart LR
    A[Fuentes oficiales<br/>API INE · Eurostat · HTML · PDF] --> B[Excel 01–05<br/>y CSV de datos_web]
    B --> C[tools/build_web_data.py<br/>copia sin modificar]
    C --> D[web-react/public/data<br/>CSV]
    D --> E[React + Vite<br/>cálculos en el navegador *]
    E --> F[GitHub Pages]
```

- La web **solo lee CSV**; los CSV de `web-react/public/data` se generan con el script y no se editan a mano.
- Los índices, variaciones, salario real y lecturas se calculan **en el navegador** y se marcan con `*`.
- Cada fila de `datos_web/` lleva `fuente_id` (→ [`FUENTES.md`](FUENTES.md)) y `tipo_dato`: `oficial`, `oficial_secundaria`, `derivado` o `estimacion_propia`.

## Algunos resultados

| | España | Madrid |
|---|---|---|
| Tasa de paro (EPA 2026T2) | 9,87 % | 7,58 % |
| Salario medio bruto anual (2024) | 29.540 € | 34.410 € |
| IPC interanual (sep-2026) | 4,9 % | 5,3 % |
| Variación del precio de la vivienda desde el mínimo de 2013 | +86,9 % | +116,3 % |
| Población (1-jul-2026, provisional) | 49,80 M | 7,20 M |

Fechas de consulta y matices (definiciones que no se pueden mezclar, muestras pequeñas, estimaciones) en cada documento de [`AIDocs/`](AIDocs).

## Estructura del repositorio

| Carpeta / archivo | Contenido |
|---|---|
| `01_…xlsx` a `05_…xlsx` | Un libro por tema (España y Madrid en paralelo), con hoja `FUENTES` |
| [`datos_web/`](datos_web) | CSV de los temas 06–09 (impuestos, pensiones, servicios públicos, PIB). Ver su [README](datos_web/README.md) |
| [`AIDocs/`](AIDocs) | Un `.md` por tema: cifras, método, limitaciones y huecos |
| [`FUENTES.md`](FUENTES.md) | Registro de fuentes (organismo, URL, primaria o secundaria) |
| [`tools/`](tools) | `build_web_data.py`: genera los CSV de la web desde los Excel y `datos_web/`; `web_en*.py`: textos en inglés del catálogo y el glosario |
| [`web-react/`](web-react) | La web (React 18, Vite 6, React Router 7, Vitest). Ver su [README](web-react/README.md) |
| `iniciar-web-react.bat` | Arranca la web en local con un doble clic (Windows) |
| [`CLAUDE.md`](CLAUDE.md) | Reglas del proyecto y resumen de los datos |

## Probarlo

### Requisitos
- [Node.js](https://nodejs.org) 20 o superior
- Python 3 con `openpyxl` (solo si quieres regenerar los datos)

### La web
```bash
cd web-react
npm install
npm run dev      # http://localhost:5173
npm test         # pruebas, incluida la comparación con los Excel
npm run build    # genera dist/
```
En Windows también vale con abrir `iniciar-web-react.bat`.

### Regenerar los datos de la web
```bash
python tools/build_web_data.py --out web-react/public/data
```
Si cambias un Excel o un CSV fuente, regenera y ejecuta `npm test`.

## Publicar en GitHub Pages

1. Copia `web-react/deploy/pages.yml` a `.github/workflows/pages.yml`.
2. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
3. Haz push a `main`: el workflow instala, pasa los tests, compila y publica.

## Hoja de ruta

- [x] Cinco temas base en Excel (empleo, salarios, coste de la vida, vivienda, población)
- [x] Impuestos, cotizaciones, desempleo, pensiones, servicios públicos y PIB en CSV
- [x] Explorador de 390 series con modos índice, variación y salario real
- [x] Simulador de sueldo, servicios públicos y paro (Comunidad de Madrid, 2026)
- [ ] Vistas de tabla, mapa y pirámide para los datos por CCAA, provincia y distrito
- [ ] Series trimestrales y mensuales en el explorador
- [ ] Simulador de pensiones
- [ ] Ampliar el simulador a otras comunidades, hijos y deducciones
- [ ] Cerrar huecos de datos (SERPAVI por municipio, población por distrito de Madrid, IPC por provincia)

Los huecos conocidos y su motivo están en [`CLAUDE.md`](CLAUDE.md).

## Uso de IA

Este proyecto se ha hecho **con ayuda de IA**: [Claude](https://claude.ai) (Anthropic) se ha usado como asistente para buscar y transcribir fuentes, escribir código y redactar la documentación. La elección de temas, la revisión de las cifras y la dirección del proyecto son del autor.

## Licencia

[MIT](LICENSE) © 2026 Daniel Fernandez, para el código. Los datos pertenecen a sus organismos de origen; consulta cada fuente en [`FUENTES.md`](FUENTES.md) antes de reutilizarlos.
