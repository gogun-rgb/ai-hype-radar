import { defineConfig, devices } from "@playwright/test";

const localUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const useManagedServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "true";

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 15_000
  },
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? localUrl,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] }
    }
  ],
  ...(useManagedServer
    ? {
        webServer: {
          command: "node scripts/playwright-server.mjs",
          url: localUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            DEMO_MODE: "true",
            E2E_DEMO: "true",
            NEXT_PUBLIC_APP_URL: localUrl,
            NO_PROXY: "localhost,127.0.0.1,::1",
            no_proxy: "localhost,127.0.0.1,::1"
          }
        }
      }
    : {})
});
