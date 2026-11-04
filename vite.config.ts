import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: 10000000,
    rollupOptions: { output: { codeSplitting: false } },
  },
});
