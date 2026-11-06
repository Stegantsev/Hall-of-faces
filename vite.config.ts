import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Relative base so the build works under any Pages path.
export default defineConfig({
  base: './',
  plugins: [vue()],
})
