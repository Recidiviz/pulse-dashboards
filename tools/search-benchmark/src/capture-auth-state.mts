// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

/**
 * Run to capture an authenticated session for use in benchmark tests.
 *
 * Usage:
 *   nx run tools:search-benchmark-capture-auth
 *
 * Cookies + localStorage get saved to auth-state.json.
 *
 * IMPORTANT: auth-state.json contains live session credentials. It is
 * gitignored — never commit it.
 */

import fs from "fs";
import puppeteer from "puppeteer";
import readline from "readline";

import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mts";

async function waitForEnter(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin });
  return new Promise((resolve) => {
    rl.question("", () => {
      rl.close();
      resolve();
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(DEFAULT_BASE_URL, { waitUntil: "networkidle0" });

  console.log("\nLog in manually in the opened window.");
  console.log(
    "Once you land on your profile / dashboard page, come back here and press Enter.\n",
  );

  await waitForEnter();

  // Use CDP directly instead of page.cookies() — page.cookies() only returns
  // cookies scoped to the current page's URL, which misses the Auth0 tenant's
  // own session cookie (set on a different domain during the login redirect).
  // Network.getAllCookies returns every cookie in the browser context.
  const client = await page.createCDPSession();
  const { cookies } = await client.send("Network.getAllCookies");
  const localStorageData = await page.evaluate(() => ({ ...localStorage }));

  fs.writeFileSync(
    AUTH_STATE_PATH,
    JSON.stringify(
      {
        cookies,
        localStorage: localStorageData,
        capturedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log(`Saved ${AUTH_STATE_PATH}.`);
  console.log(
    "Re-run this script whenever benchmark trials start failing to land on an authenticated page — the session has likely expired.",
  );

  await browser.close();
})();
