import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRUCIAL: Base path MUST match your GitHub repository name
  base: '/BGP_DualISP_Simulator/', 
});