import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'
import dts from 'vite-plugin-dts';
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: false,
      outDir: 'dist/types',
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      three: path.resolve(__dirname, 'node_modules/three')
    },
  },
})
