import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Component from 'unplugin-vue-component/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    Vue(),
    AutoImport({
      imports: ['vue'],
      dts: 'src/types/auto-imports.d.ts'
    }),
    Component({
      dts: 'src/types/components.d.ts'
    })
  ],
})
