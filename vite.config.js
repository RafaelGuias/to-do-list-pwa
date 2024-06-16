import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "https://RafaelGuias.github.io/to-do-list-pwa/",
  plugins: [react()],
  
});
