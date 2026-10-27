/**
 * Reparto del PIB por ramas de actividad (INE, Contabilidad Nacional Anual, tabla 69070).
 *
 * Las cifras en euros son del INE; los porcentajes y la variación los calculamos nosotros (*).
 * El árbol es: PIB → (agricultura, industria, construcción, servicios, impuestos) → ramas → subramas.
 */

export const SECTOR_YEARS = [2025, 2024];
export const LATEST_YEAR = 2025;
export const PREVIOUS_YEAR = 2024;
/** Fila del árbol que no es una rama de actividad: el PIB es el VAB más estos impuestos. */
export const TAX_ID = 'impuestos';
export const ROOT_ID = 'pib';

/**
 * @typedef {object} SectorNode
 * @property {string} id
 * @property {number} level
 * @property {string|null} parentId
 * @property {string} label       nombre oficial
 * @property {string} short       nombre corto para el centro del gráfico
 * @property {Record<number, number>} values  millones de euros por año
 * @property {string} tipo        oficial | derivado
 * @property {string} nota
 * @property {SectorNode[]} children
 */

/**
 * Convierte las filas del CSV en un árbol y comprueba que cada rama suma exactamente lo que dicen sus hijas.
 * @param {Record<string,string>[]} rows
 */
export function buildSectorTree(rows) {
  const nodes = new Map();
  for (const r of rows) {
    const values = { 2024: Number(r.vab_2024_millones_eur), 2025: Number(r.vab_2025_millones_eur) };
    if (!Number.isFinite(values[2024]) || !Number.isFinite(values[2025])) throw new Error(`Sectores: valor no numérico en «${r.rama_id}»`);
    nodes.set(r.rama_id, {
      id: r.rama_id, level: Number(r.nivel), parentId: r.padre_id || null, label: r.rama, short: r.rama_corta || r.rama,
      values, tipo: r.tipo_dato, nota: r.nota, children: [],
    });
  }
  for (const n of nodes.values()) {
    if (!n.parentId) continue;
    const parent = nodes.get(n.parentId);
    if (!parent) throw new Error(`Sectores: «${n.id}» tiene un padre desconocido («${n.parentId}»)`);
    parent.children.push(n);
  }
  const root = nodes.get(ROOT_ID);
  if (!root) throw new Error('Sectores: falta la fila del PIB');
  for (const n of nodes.values()) {
    if (!n.children.length) continue;
    for (const y of SECTOR_YEARS) {
      const sum = n.children.reduce((acc, c) => acc + c.values[y], 0);
      if (sum !== n.values[y]) throw new Error(`Sectores: las partes de «${n.id}» suman ${sum} y no ${n.values[y]} en ${y}`);
    }
  }
  return { root, nodes };
}

/** VAB total de un año: el PIB menos los impuestos netos sobre los productos. */
export function vabTotal(tree, year) {
  return tree.root.values[year] - tree.nodes.get(TAX_ID).values[year];
}

/**
 * Lo que se dibuja al estar en un nodo: sus hijas, ordenadas de mayor a menor, con su peso.
 *
 * - `share`: peso sobre la suma de lo que se ve (el queso siempre suma 100).
 * - `shareOfBase`: peso sobre el PIB (`base = 'pib'`) o sobre el VAB (`base = 'vab'`); en el VAB no hay impuestos.
 * - `growth`: variación nominal 2025/2024 en %.
 * - `slot`: color estable de la entidad (su posición entre hermanas en el CSV); 0 = neutro (impuestos).
 *
 * @param {{root: SectorNode, nodes: Map<string, SectorNode>}} tree
 * @param {string} nodeId
 * @param {{year?: number, base?: 'pib'|'vab'}} [opts]
 */
export function sectorView(tree, nodeId, { year = LATEST_YEAR, base = 'pib' } = {}) {
  const node = tree.nodes.get(nodeId);
  if (!node) throw new Error(`Sectores: nodo desconocido «${nodeId}»`);
  const baseTotal = base === 'vab' ? vabTotal(tree, year) : tree.root.values[year];
  const hideTax = base === 'vab' && node.id === ROOT_ID;
  const kids = node.children.filter((c) => !(hideTax && c.id === TAX_ID));
  const total = kids.reduce((acc, c) => acc + c.values[year], 0);
  const order = new Map(node.children.map((c, i) => [c.id, i]));
  const slices = kids
    .map((c) => ({
      node: c,
      value: c.values[year],
      share: (c.values[year] / total) * 100,
      shareOfBase: (c.values[year] / baseTotal) * 100,
      growth: (c.values[LATEST_YEAR] / c.values[PREVIOUS_YEAR] - 1) * 100,
      slot: c.id === TAX_ID ? 0 : (order.get(c.id) % 8) + 1,
      drillable: c.children.length > 0,
    }))
    .sort((a, b) => b.value - a.value);
  return {
    node, year, base, total, baseTotal, slices,
    shareOfBase: (total / baseTotal) * 100,
    growth: (node.values[LATEST_YEAR] / node.values[PREVIOUS_YEAR] - 1) * 100,
  };
}

/** Camino de nodos desde el PIB hasta `nodeId` (ambos incluidos). */
export function pathTo(tree, nodeId) {
  const out = [];
  for (let n = tree.nodes.get(nodeId); n; n = n.parentId ? tree.nodes.get(n.parentId) : null) out.unshift(n);
  return out;
}

/** Todas las filas en orden de árbol (para la tabla completa). */
export function flatten(tree) {
  const out = [];
  const walk = (n) => { out.push(n); n.children.forEach(walk); };
  walk(tree.root);
  return out;
}
