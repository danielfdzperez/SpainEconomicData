import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DataRepository } from '../src/data/DataRepository.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function loadRepo() {
  const repo = new DataRepository((p) => readFile(join(root, 'public', p), 'utf-8'));
  return repo.load();
}

export const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
