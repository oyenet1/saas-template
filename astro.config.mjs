// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import ui from '@nuxt/ui/vite';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';

// Default to Node adapter so auth middleware and `prerender = false` routes
// run on-demand in local dev. Use HOSTING=cloudflare for production builds.
const hosting = process.env.HOSTING === 'cloudflare' ? 'cloudflare' : 'node';

const adapters = {
  cloudflare: cloudflare(),
  node: node({ mode: 'standalone' }),
};

const selectedAdapter = adapters[hosting];

export default defineConfig({
  output: selectedAdapter ? 'server' : 'static',
  adapter: selectedAdapter ?? undefined,
  integrations: [vue({ appEntrypoint: './src/vue-app.ts' })],
  vite: {
    plugins: [
      tailwindcss(),
      ui({
        colorMode: true,
        ui: {
          colors: { primary: 'blue', neutral: 'slate' },
        },
        autoImport: {
          imports: ['vue', 'vue-router', '@vueuse/core', 'vue-i18n'],
        },
      }),
    ],
  },
});
