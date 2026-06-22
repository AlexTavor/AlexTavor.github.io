import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Source for the PDD explorer served at https://alextavor.github.io/pdd/.
// `npm run build` writes the built site straight into ../pdd (the served directory),
// with asset URLs rooted at /pdd/. `npm run dev` serves at / for local development.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pdd/' : '/',
  build: { outDir: '../pdd', emptyOutDir: true },
  plugins: [react()],
}));
