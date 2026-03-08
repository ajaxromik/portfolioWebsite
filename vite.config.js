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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Put Firebase in its own chunk
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            // Put Bootstrap/Popper in their own chunk
            if (id.includes('bootstrap') || id.includes('@popperjs')) {
              return 'ui-vendor';
            }
            // Everything else goes here
            return 'vendor';
          }
        }
      }
    }
  }
  // ,
  // server: {
  //   host: true,
  //   port: 5173
  // }
})
