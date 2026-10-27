import { describe, expect, test } from 'vitest';
import en from '../src/i18n/en.js';
import { extractKeys, placeholders } from '../tools/i18n-extract.mjs';

const keys = extractKeys();

describe('diccionario inglés', () => {
  test('todos los textos del código tienen traducción', () => {
    const faltan = [...keys.keys()].filter((k) => en[k] === undefined);
    expect(faltan, `Añade estas claves a src/i18n/en/*.js:\n${faltan.join('\n')}`).toEqual([]);
  });

  test('la traducción conserva los {marcadores} del texto original', () => {
    const mal = Object.entries(en).filter(([k, v]) => placeholders(k.replace(/¦.*$/, '')) !== placeholders(v)).map(([k]) => k);
    expect(mal).toEqual([]);
  });

  test('ninguna traducción está vacía ni es igual al texto en español con tildes o eñes', () => {
    const vacias = Object.entries(en).filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k);
    expect(vacias).toEqual([]);
    const sinTraducir = Object.entries(en).filter(([k, v]) => k === v && /[áéíóúñ¿¡]/i.test(k)).map(([k]) => k);
    expect(sinTraducir).toEqual([]);
  });

  test('el inglés usa comillas tipográficas y no deja signos de apertura del español', () => {
    const mal = Object.entries(en).filter(([, v]) => /[¿¡«»]/.test(v)).map(([k]) => k);
    expect(mal).toEqual([]);
  });
});
