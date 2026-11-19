import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { mkdir, writeFile } from "node:fs/promises";
import path from "path";

function radixDappManifest(dAppDefinitionAddress: string): Plugin {
  return {
    name: "gachafi-radix-dapp-manifest",
    async closeBundle() {
      if (!dAppDefinitionAddress) return;
      const directory = path.resolve(__dirname, "dist/.well-known");
      await mkdir(directory, { recursive: true });
      await writeFile(
        path.join(directory, "radix.json"),
        `${JSON.stringify({ dApps: [{ dAppDefinitionAddress }] }, null, 2)}\n`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), radixDappManifest(env.VITE_RADIX_DAPP_DEFINITION || "")],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules/@radixdlt/")) return "radix-dlt";
            if (id.includes("node_modules/@sentry/")) return "sentry";
            if (id.includes("node_modules/zod/")) return "validation";
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) {
              return "react-vendor";
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
  };
});
