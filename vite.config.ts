import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    // Source maps are disabled in production to prevent TypeScript source
    // exposure. Upload maps privately to Sentry if error tracking is needed.
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (/react|react-dom|react-router-dom/.test(id)) return 'react-vendor';
            if (/radix-ui/.test(id)) return 'ui-vendor';
            if (/radixdlt/.test(id)) return 'radix-dlt';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 8080,
    host: "::",
  },
}));
