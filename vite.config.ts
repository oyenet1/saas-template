import { fileURLToPath, URL } from 'node:url'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    VueRouter({
      dts: './typed-router.d.ts',
      routesFolder: './src/pages',
      extensions: ['.vue'],
    }),
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'big-stone',
        },
        tooltip: {
          slots: {
            text: 'truncate text-base',
          },
        },
      },
      autoImport: {
        imports: [
          'vue',
          VueRouterAutoImports,
          {
            pinia: ['defineStore', 'storeToRefs'],
            ofetch: ['$fetch'],
            '@unhead/vue': ['useHead', 'useSeoMeta'],
            '@vueuse/core': ['useColorMode'],
          },
        ],
        dirs: [
          './src/composables',
          './src/stores',
          './src/utils',
          './src/shared/utils',
        ],
        dts: './auto-imports.d.ts',
        vueTemplate: true,
        eslintrc: {
          enabled: false,
        },
      },
      components: {
        dirs: ['./src/components'],
        dts: './components.d.ts',
      },
    }),
  ],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
