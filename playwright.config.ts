import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

const PORT = 3100;
// Usa PW_CHROMIUM, ou o Chromium pré-instalado deste ambiente, ou o do Playwright (`npx playwright install chromium`).
const executablePath = process.env.PW_CHROMIUM || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "off", launchOptions: { executablePath } },
  projects: [
    { name: "computador", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } },
    { name: "celular", use: { ...devices["Pixel 7"], launchOptions: { executablePath } } },
  ],
  webServer: {
    // Banco de testes isolado, recriado a cada execução (PGlite em .data/e2e)
    command: `rm -rf .data/e2e && npx tsx scripts/seed.ts --demo && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { PGLITE_DIR: ".data/e2e", DEV_MAILBOX: "true", APP_URL: `http://localhost:${PORT}`, DATABASE_URL: "" },
  },
});
