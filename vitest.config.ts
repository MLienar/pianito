import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts"],
  },
  resolve: {
    conditions: ["source"],
    alias: {
      "@": new URL("./packages/web/src", import.meta.url).pathname,
    },
  },
});
