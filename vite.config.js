import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [],
  server: {
    host: true,
    port: 5174,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(root, 'index.html'),
        admin: path.resolve(root, 'admin/index.html'),
      },
    },
  },
})
