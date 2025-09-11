import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false, 
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'popup.html',
        options: 'options.html',
        background: 'src/background/index.ts',
        content: 'src/content/index.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // For content and background scripts, we need different handling
          if (chunkInfo.name === 'content' || chunkInfo.name === 'background') {
            return '[name].js'
          }
          return '[name].js'
        },
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'es', // Use ES modules format initially
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './src'),
    },
  },
})
