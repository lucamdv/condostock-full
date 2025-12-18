import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Necessário para o Docker expor a rede
    port: 5173,
    watch: {
      usePolling: true, // <--- O SALVADOR DA PÁTRIA NO WINDOWS
    }
  }
})