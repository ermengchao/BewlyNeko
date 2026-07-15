import { defineConfig } from 'vite'

import packageJson from './package.json'
import { isDev, isFirefox, isSafari, r } from './scripts/utils'
import { SAFARI_PAGE_SCRIPT_GUARD, SAFARI_PAGE_SCRIPT_READY } from './src/constants/safari'
import { sharedConfig } from './vite.config'

// bundling the content script using Vite
export default defineConfig({
  ...sharedConfig,
  build: {
    watch: isDev
      ? { include: ['./**/*'] }
      : undefined,
    outDir: r(isFirefox ? 'extension-firefox/dist/contentScripts' : isSafari ? 'extension-safari/dist/contentScripts' : 'extension/dist/contentScripts'),
    cssCodeSplit: false,
    emptyOutDir: false,
    sourcemap: false, // https://github.com/vitejs/vite-plugin-vue/issues/35
    lib: {
      entry: r('src/inject/index.ts'),
      name: packageJson.name,
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'inject.global.js',
        extend: true,
        intro: `const bewlyPageScriptGuard = Symbol.for(${JSON.stringify(SAFARI_PAGE_SCRIPT_GUARD)}); if (globalThis[bewlyPageScriptGuard] !== 'ready') { globalThis[bewlyPageScriptGuard] = 'initializing';`,
        outro: `globalThis[bewlyPageScriptGuard] = 'ready'; window.postMessage({ type: ${JSON.stringify(SAFARI_PAGE_SCRIPT_READY)} }, '*'); } else { window.postMessage({ type: ${JSON.stringify(SAFARI_PAGE_SCRIPT_READY)} }, '*'); }`,
      },
    },
  },
})
