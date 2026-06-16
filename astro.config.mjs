// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import ui from '@nuxt/ui/vite';

export default defineConfig({
  integrations: [vue()],
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
