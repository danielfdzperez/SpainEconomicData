import { test } from 'vitest';
import assert from 'node:assert/strict';
import { parseCsv, parseCsvObjects, toCsv } from '../src/data/csv.js';

test('campos simples y cabecera', () => {
  assert.deepEqual(parseCsvObjects('a,b\n1,2\n3,4\n'), [{ a: '1', b: '2' }, { a: '3', b: '4' }]);
});

test('comillas, comas y saltos dentro de campo', () => {
  const rows = parseCsv('a,b\n"x, y","l1\nl2"\n"di ""hola""",z');
  assert.deepEqual(rows[1], ['x, y', 'l1\nl2']);
  assert.deepEqual(rows[2], ['di "hola"', 'z']);
});

test('CRLF, BOM y líneas vacías finales', () => {
  assert.deepEqual(parseCsv('﻿a,b\r\n1,2\r\n\r\n'), [['a', 'b'], ['1', '2']]);
});

test('campo vacío al final de línea', () => {
  assert.deepEqual(parseCsv('a,b,c\n1,,\n'), [['a', 'b', 'c'], ['1', '', '']]);
});

test('toCsv ida y vuelta', () => {
  const rows = [['a', 'b'], ['x,y', 'q"r'], ['1\n2', '']];
  assert.deepEqual(parseCsv(toCsv(rows)), rows);
});
