import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// No public/ files or remote fonts: all game assets enter Vite's module graph.
// Fonts become data URLs. Landscapes and actors are Canvas paths, not files.
export default defineConfig(({ mode }) => ({
  plugins: [
    viteSingleFile(),
    {
      name: 'embedded-license-notices',
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            attrs: { type: 'text/plain', id: 'third-party-notices' },
            children: readFileSync(new URL('./THIRD_PARTY_NOTICES.txt', import.meta.url), 'utf8'),
            injectTo: 'body',
          },
        ];
      },
    },
  ],
  define: { __LOAD_POKI_SDK__: JSON.stringify(mode === 'poki') },
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  build: { target: 'es2020', assetsInlineLimit: Infinity, cssCodeSplit: false },
}));
