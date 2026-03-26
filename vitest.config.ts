import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@pianito/shared": new URL(
        "./packages/shared/src/index.ts",
        import.meta.url,
      ).pathname,
      "@pianito/api": new URL("./packages/api/src", import.meta.url).pathname,
      "@pianito/web": new URL("./packages/web/src", import.meta.url).pathname,
    },
  },
  test: {
    include: ["packages/*/src/**/*.test.ts"],
  },
});