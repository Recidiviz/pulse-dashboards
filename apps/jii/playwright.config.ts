// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { nxE2EPreset } from "@nx/playwright/preset";
import { defineConfig } from "@playwright/test";
import { join } from "path";

const baseURL = "http://localhost:4200/";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: "./e2e" }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    // set browser to UTC to avoid timezone issues when manipulating time for tests
    timezoneId: "UTC",
  },
  retries: 3,
  projects: [
    {
      name: "Android tablet",
      use: {
        defaultBrowserType: "chromium",
        // we expect a wide range of device sizes, this is somewhere
        // in the middle-ish
        viewport: {
          height: 1100,
          width: 675,
        },
        isMobile: true,
        hasTouch: true,
        // expecting less capable devices as the default
        deviceScaleFactor: 1,
        storageState: {
          cookies: [],
          origins: [
            {
              origin: baseURL,
              localStorage: [
                // helps with consistent homepage behavior, can be disabled per test as needed
                { name: "disableOnboarding", value: "true" },
              ],
            },
          ],
        },
      },
    },
  ],
  webServer: {
    // TUI hijacks the process and stops Playwright from starting up
    command: "NX_TUI=false nx offline-e2e jii",
    cwd: join(__dirname, "../../"),
    url: baseURL,
    reuseExistingServer: false,
  },
  // overriding the default to keep platform out of the filename
  // (otherwise dev and CI expect different snapshot files).
  snapshotPathTemplate:
    "{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}",
});
