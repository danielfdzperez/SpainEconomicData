import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funciona en GitHub Pages (usuario.github.io/repo/) sin conocer el nombre del repo
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { sourcemap: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx,mjs}'],
    testTimeout: 20000, // los tests de página montan gráficos completos en jsdom; con CPU justa superan 5 s
  },
});
