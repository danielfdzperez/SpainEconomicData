// Extrae del código todas las claves de traducción (textos en español dentro de t(), tx(), tOpt() y lit()).
// Uso:  node tools/i18n-extract.mjs            → resumen y claves que faltan en el diccionario inglés
//       node tools/i18n-extract.mjs --json     → todas las claves como JSON (clave → archivos)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Se pasa por una cadena (no un objeto URL) porque en los tests, con jsdom, `URL` no es el de Node.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const CALL = /(?<![\w.$])(t|tx|tOpt|lit)\(\s*('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\$]|\\.)*`)/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'i18n') walk(p, out); } else if (/\.jsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** @returns {Map<string, Set<string>>} clave → archivos */
export function extractKeys() {
  const keys = new Map();
  for (const file of walk(ROOT)) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(CALL)) {
      let key;
      try { key = new Function(`return ${m[2]}`)(); } catch { continue; }
      if (typeof key !== 'string' || !/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(key)) continue;
      if (!keys.has(key)) keys.set(key, new Set());
      keys.get(key).add(relative(ROOT, file).replaceAll('\\', '/'));
    }
  }
  return keys;
}

export const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const keys = extractKeys();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(Object.fromEntries([...keys].map(([k, v]) => [k, [...v]])), null, 1));
  } else {
    const en = (await import('../src/i18n/en.js')).default;
    const falta = [...keys.keys()].filter((k) => en[k] === undefined);
    const sobra = Object.keys(en).filter((k) => !keys.has(k));
    console.log(`Claves en el código: ${keys.size} · en el diccionario: ${Object.keys(en).length} · faltan: ${falta.length}`);
    if (process.argv.includes('--missing')) for (const k of falta) console.log(JSON.stringify(k), '←', [...keys.get(k)].join(', '));
    if (process.argv.includes('--unused')) console.log(`Entradas sin uso directo (pueden ser datos CSV): ${sobra.length}`);
    const malas = Object.keys(en).filter((k) => placeholders(k) !== placeholders(en[k]));
    for (const k of malas) console.log('MARCADORES DISTINTOS:', JSON.stringify(k));
  }
}
