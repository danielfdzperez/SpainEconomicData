# Datos de España — React

Visualizador interactivo de salarios, IPC, PIB, vivienda, población, empleo y gasto de los hogares de España (INE, Eurostat). Está disponible en **castellano e inglés** (botón en la cabecera).

**Regla de la casa:** todo lo que lleva `*` es un cálculo o una estimación nuestra, no un dato oficial.

## Qué hace
- **Explorador**: 390 series (salarios por medida, edad, sector, ocupación y contrato; IPC; PIB; vivienda; población; paro, empleo y actividad; desigualdad; gasto y renta de los hogares) con **buscador**; hasta 8 series a la vez, valores originales / índice base 100 / variación anual / acumulada, rango y año base, salario real (deflactado con el IPC), marcas de épocas, tabla y descarga CSV, estado compartible en la URL.
- **Ayuda contextual** en cada término y serie; **lectura interpretada** (▲ ▼ ■) del IPC y del PIB.
- **Simulador** (`#/simulador`): sueldo bruto (o autónomo) → nómina y coste de empresa desglosado, uso de sanidad, educación y transporte a lo largo de la vida (público frente a privado, % del sueldo, totales, visitas en toda la vida o al año, seguro de salud privado), balance aportado/usado con el paro generado y cobrado (historial laboral opcional) y paro que te tocaría hoy. Comunidad de Madrid, 2026, estimación.
- Páginas explicativas del IPC (con calculadora) y del PIB, y una de método y fuentes.
- **Castellano / inglés**: el botón de la cabecera cambia todos los textos, el catálogo de series y el glosario sin recargar ni perder lo elegido; se recuerda la elección (ver «Idiomas»).

## Stack
React 18 · Vite 6 · React Router 7 (`HashRouter`, sin configuración de servidor en GitHub Pages) · Vitest 4 + Testing Library. Necesita Node 20 o superior (`node -v`). Gráficos en SVG propio (sin librería de gráficos). Sin TypeScript: JSDoc en el dominio.

## Ejecutar
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 219 pruebas
npm run build      # genera dist/
```

Si `npm install` falla con «Cannot read properties of null (reading 'edgesOut')» (fallo de npm 10 con los peers opcionales de Vitest 4 cuando no hay `package-lock.json`), usa `npm install --legacy-peer-deps`. Con el lockfile del repositorio no ocurre.

## Dependencias y seguridad
`npm audit` da **0 vulnerabilidades** (comprobado el 2026-10-22). No hace falta `npm audit fix --force`, que subiría versiones mayores sin control. Los avisos que había (Vite/esbuild, Vitest/Tinypool, React Router) se resolvieron actualizando a Vite 6.4.5, Vitest 4.1.12 y React Router 7.18.4. Si reaparecen avisos, actualiza con `npm update` y vuelve a ejecutar `npm test` y `npm run build`.

## Arquitectura
```
src/
  domain/      lógica pura (sin React ni DOM): Series, transformaciones, deflactor, estadísticas, interpretación, payroll/autonomo/economia/paro/historial/services/balance del simulador
  data/        CSV → DataRepository; DataContext.jsx lo expone con un hook (useRepo)
  state/       explorerReducer (reglas puras) + useExplorer (hook) + urlState (URL ↔ estado)
  charts/      escalas, LineChart/BarChart declarativos en SVG, tooltip, hooks (ancho, colores estables)
  components/  Workbench (compone todo), SeriesPicker, Controls, Legend, Insights, Footnotes, DataTable, Help…
  pages/       Home, Explorer, Ipc, Pib, Simulador, Metodo (cargadas con React.lazy)
  content/     gráficos preparados y marcas de épocas
  i18n/        idioma sin librerías: index.js (t, tx, lit, useLang…) y en/ (diccionario español → inglés)
  styles/      CSS con variables (tema claro/oscuro, `data-theme` + `prefers-color-scheme`)
public/data/   series.csv, catalog.csv, glossary.csv, pib_sectores.csv, sus versiones *_en.csv y sim/ (21 CSV del simulador); generados, no editar a mano
tests/         dominio, reducer, componentes y comparación con los Excel
```
Decisiones:
- **Dominio fuera de React**: se pudo reutilizar íntegro desde la versión vanilla y se prueba en Node, sin renderizar nada.
- **Reducer puro** para el estado del explorador: las reglas (máximo de series, unidades compatibles) se prueban sin componentes; `useExplorer` sólo lo conecta.
- **Gráficos declarativos**: la geometría es función de (datos, ancho); el hover es estado de React, no manipulación del DOM.
- **Un solo globo de ayuda** (portal) con disparadores accesibles por ratón, teclado y toque.
- **Accesibilidad**: foco visible, gráficos recorribles con flechas, tabla de datos equivalente, `aria-live` en los mensajes, respeto de `prefers-reduced-motion`.

## Datos
Se generan desde los Excel y CSV de la carpeta de datos con el script de la raíz:
```bash
python tools/build_web_data.py --out web-react/public/data
```
El script copia las series sin tocarlas; los cálculos (índices, salario real, variaciones, lecturas) se hacen en el navegador y se marcan con `*`. Al final llama a `tools/web_en.py`, que crea `catalog_en.csv`, `glossary_en.csv` y `pib_sectores_en.csv` (si falta una traducción, falla y la lista). También se puede lanzar suelto: `python tools/web_en.py`.

## Idiomas
- **Texto del código**: el español es la clave. `t('Qué mostrar')`, `t('Entre {a} y {b}', { a, b })`, `tx(…)` con elementos React, `lit('…')` para constantes de módulo (se traducen con `t()` al pintarlas). La traducción inglesa está en `src/i18n/en/*.js`. Si un texto en español significa dos cosas, se separa con `¦` (`'Al año¦hasta el año'`).
- **Texto de los datos**: `catalog_en.csv`, `glossary_en.csv` y `pib_sectores_en.csv` se generan con `tools/web_en*.py`; la web los carga según el idioma y, si faltan, usa el español.
- **Nuevo texto**: escríbelo en español en `t()` y añádelo a `src/i18n/en/`. `node tools/i18n-extract.mjs` (`--missing`, `--unused`, `--json`) lista lo que falta; `npm test` falla si falta alguno o si queda español en alguna página en inglés.
- **Pruebas**: `tests/i18n-*.test.*` y `tests/catalog-en.test.mjs`. Con `renderApp(() => <App… />)` (una función) la página se repinta al cambiar de idioma, como en la app.

## Publicar
`deploy/pages.yml` es el workflow de GitHub Actions (tests + build + Pages): cópialo a `.github/workflows/pages.yml` en la raíz del repositorio y activa Pages → Source: GitHub Actions. `base: './'` en `vite.config.js` hace que funcione bajo cualquier ruta.
