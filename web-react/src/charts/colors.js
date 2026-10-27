/**
 * Asignación estable de huecos de color (1..8): una serie conserva su color mientras siga
 * seleccionada aunque se quiten otras (el color sigue a la serie, no a su posición).
 */
export const SLOT_COUNT = 8;

/**
 * @param {Map<string, number>} previous  asignación anterior
 * @param {string[]} ids                  ids visibles, en orden de selección
 * @returns {Map<string, number>}
 */
export function assignSlots(previous, ids) {
  const next = new Map([...previous].filter(([id]) => ids.includes(id)));
  const used = new Set(next.values());
  for (const id of ids) {
    if (next.has(id)) continue;
    let slot = 1;
    while (used.has(slot) && slot < SLOT_COUNT) slot++;
    next.set(id, slot);
    used.add(slot);
  }
  return next;
}
