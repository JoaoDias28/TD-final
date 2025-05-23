import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { imagetools } from 'vite-imagetools'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr(), imagetools()],
  base: "/",
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
})
