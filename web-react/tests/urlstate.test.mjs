import { test } from 'vitest';
import assert from 'node:assert/strict';
import { decodeState, encodeState, DEFAULT_STATE } from '../src/state/urlState.js';

test('ida y vuelta', () => {
  const state = { selected: ['sal_media_es_t', 'ipc_es', 'sal_media_es_t~real'], mode: 'index', base: 2008, from: 2008, to: 2024, context: false };
  assert.deepEqual(decodeState(encodeState(state)), state);
});

test('entradas inválidas se ignoran', () => {
  const s = decodeState(new URLSearchParams('s=ok,<script>&m=hack&b=abc&f=1800'));
  assert.deepEqual(s.selected, ['ok']);
  assert.equal(s.mode, DEFAULT_STATE.mode);
  assert.equal(s.base, null);
  assert.equal(s.from, null);
});
