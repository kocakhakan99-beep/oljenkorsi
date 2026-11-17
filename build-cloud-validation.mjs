import { build } from 'vite';
import { fileURLToPath } from 'node:url';

// The Edge Function uses exactly the same validation logic as the browser.
await build({
  configFile: false,
  logLevel: 'warn',
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/services/cloud-validation.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'cloud-validation.mjs',
    },
    outDir: fileURLToPath(new URL('./supabase/functions/_shared', import.meta.url)),
    emptyOutDir: false,
    minify: false,
  },
});
