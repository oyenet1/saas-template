// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import ui from '@nuxt/ui/vite';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [vue({ appEntrypoint: '/src/vue-app' })],
  vite: {
    plugins: [
      tailwindcss(),
      ui({
        colorMode: true,
        ui: {
          colors: {
            primary: 'teal',
            neutral: 'stone',
          },
        },
        autoImport: {
          imports: [
            'vue',
            'vue-router',
            '@vueuse/core',
            'vue-i18n',
          ],
        },
      }),
    ],
  },
});
