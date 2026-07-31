import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against a deployed URL (production by default) and is deliberately
 * read-only, so it's safe to run any time without polluting real data.
 * Override with E2E_BASE_URL to point at a preview deploy or localhost:3000.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://getspuds.com",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
