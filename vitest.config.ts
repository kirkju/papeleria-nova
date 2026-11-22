import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Pure-logic tests (validators, utils, stores): no DOM needed
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Each test file starts from a clean state
    isolate: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
