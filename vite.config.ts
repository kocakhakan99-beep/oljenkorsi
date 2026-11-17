import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ command }) => ({
  root: 'src',
  base: './',
  // Avoid PDF.js runtime import.meta while keeping the app's PDF parser in a lazy chunk.
  define: command === 'build' ? { 'import.meta.url': 'globalThis.location.href' } : {},
  plugins: [tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: 10000000,
  },
}));
