import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path is /bike-ritt-weathery/ when building on GitHub Actions, / otherwise.
// This allows the same build to work both locally and on GitHub Pages.
const base = process.env.GITHUB_ACTIONS ? '/bike-ritt-weathery/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    open: true,
  },
})
