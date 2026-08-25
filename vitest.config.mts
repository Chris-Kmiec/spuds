import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e/ belongs to Playwright, which has its own incompatible runner.
    include: ["src/**/*.test.ts"],
  },
});
