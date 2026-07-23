import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const dashboard = mode === "dashboard";
  const artifact = dashboard ? "yarr-dashboard" : "yarr-settings";

  return {
    plugins: [vue({ customElement: /\.ce\.vue$/ })],
    build: {
      outDir: dashboard ? "dist/dashboard" : "dist/settings",
      emptyOutDir: true,
      cssCodeSplit: false,
      lib: {
        entry: fileURLToPath(new URL(dashboard ? "./src/dashboard-entry.ts" : "./src/settings-entry.ts", import.meta.url)),
        name: dashboard ? "YarrDashboard" : "YarrSettings",
        formats: ["es"],
        fileName: () => `${artifact}.js`,
      },
      rollupOptions: {
        output: {
          assetFileNames: `${artifact}.[ext]`,
          chunkFileNames: `${artifact}-[name]-[hash].js`,
        },
      },
    },
  };
});
