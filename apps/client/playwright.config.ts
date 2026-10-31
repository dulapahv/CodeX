/**
 * Playwright test configuration for end-to-end testing.
 * Features:
 * - Parallel test execution
 * - Retries and timeouts
 * - Multi-browser support
 * - Screenshot and trace capture
 *
 * Modified by Dulapah Vibulsanti (https://dulapahv.dev) from auto-generated
 * code by Playwright CLI.
 */

import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// biome-ignore lint/correctness/noGlobalDirnameFilename: Playwright transforms config as CJS where import.meta.dirname is unavailable
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  expect: {
    timeout: 30_000, // Timeout for each expect
  },
  forbidOnly: !!process.env.CI, // Fail the build on CI if you accidentally left test.only in the source code
  fullyParallel: true, // Run tests in files in parallel
  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      // Mobile browsers can't share a screen
      testIgnore: ["**/media.spec.ts"],
      use: { ...devices["Pixel 5"] },
    },
  ],
  reporter: process.env.CI ? [["html"], ["github"]] : "html", // Reporter to use
  retries: process.env.CI ? 2 : 0, // Retry on CI only
  testDir: "./tests/e2e",
  // Video calls need the Realtime SFU, so they run only when the server has
  // dev SFU credentials in apps/server/.dev.vars
  testIgnore: process.env.E2E_SFU ? [] : ["**/media.spec.ts"],
  timeout: 120_000, // Timeout for each test
  // Shared settings for all the projects below
  use: {
    baseURL: "http://localhost:3000", // Base URL for all the projects
    screenshot: "only-on-failure", // Collect screenshot after each test failure
    trace: "on-first-retry", // Collect trace when retrying the failed test
  },

  // Configure the web server for the test
  webServer: [
    {
      command: process.env.CI
        ? "cd ../server && pnpm start"
        : "cd ../server && pnpm dev",
      reuseExistingServer: !process.env.CI,
      stderr: "pipe",
      stdout: "pipe",
      url: "http://localhost:3001",
    },
    {
      command: process.env.CI ? "pnpm start" : "pnpm dev",
      // Fake OAuth apps plus the test proxy, so repository tests can answer
      // the server's provider API calls (see tests/e2e/repository)
      env: {
        BITBUCKET_CLIENT_ID: "test-client",
        BITBUCKET_CLIENT_SECRET: "test-secret",
        CODEBERG_CLIENT_ID: "test-client",
        CODEBERG_CLIENT_SECRET: "test-secret",
        GITHUB_CLIENT_SECRET_DEV: "test-secret",
        GITHUB_CLIENT_SECRET_PROD: "test-secret",
        GITLAB_CLIENT_ID: "test-client",
        GITLAB_CLIENT_SECRET: "test-secret",
        NEXT_TEST_PROXY: "true",
      },
      reuseExistingServer: !process.env.CI,
      stderr: "pipe",
      stdout: "pipe",
      url: "http://localhost:3000",
    },
  ],
  workers: 8, // Number of workers to run the tests
});
