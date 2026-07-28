import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue({ customElement: true })],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.spec.ts"],
    restoreMocks: true,
  },
});
