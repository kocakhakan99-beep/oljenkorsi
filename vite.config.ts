import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: {
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: 10000000,
    rollupOptions: { output: { codeSplitting: false } },
  },
});
