import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/unit/setup.ts"],
    env: { PGLITE_DIR: "memory", NODE_ENV: "test", DATABASE_URL: "" },
    testTimeout: 30000,
    hookTimeout: 60000,
    pool: "forks",
  },
});
