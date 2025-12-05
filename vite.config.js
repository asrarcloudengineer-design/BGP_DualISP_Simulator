// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL FIX: The base path MUST match your GitHub repository name
  base: '/BGP_DualISP_Simulator/', // <--- ENSURE THIS IS THE CORRECT LINE
});
