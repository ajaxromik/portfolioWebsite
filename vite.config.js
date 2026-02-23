import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // quiet the deprecation warnings that sass creates when reading the current version of bootstrap
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true
      }
    }
  }
})
