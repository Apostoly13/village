import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.DEV_FRONTEND_URL ||
  "https://dev.ourlittlevillage.com.au";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 1,
  workers: 2,
  fullyParallel: false,
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/e2e-results.json" }],
  ],

  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  outputDir: "test-results/playwright-output",

  projects: [
    // Desktop
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    // Mobile
    {
      name: "iphone-se",
      use: { ...devices["iPhone SE"] },
    },
    {
      name: "iphone-12",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "pixel-5",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "ipad",
      use: { ...devices["iPad (gen 7)"] },
    },
  ],
});
