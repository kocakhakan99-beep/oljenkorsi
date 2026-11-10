import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ command }) => ({
  root: 'src',
  base: './',
  // Standalone output runs as a classic inline script; PDF.js must not retain import.meta.
  define: command === 'build' ? { 'import.meta.url': 'globalThis.location.href' } : {},
  plugins: [tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: 10000000,
    rollupOptions: { output: { codeSplitting: false } },
  },
}));
