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

import type { Page } from "playwright-core";

import type { SyntheticMonitorConfig } from "./config";
import { log } from "./log";

const TIMEOUT_MS = 30_000;

// Pathways "Prison population over time" time-series chart.
// Route is /system/:pageId/:sectionId? — see libs/shared-pathways/src/views.ts
// (PATHWAYS_PAGES.prison + PATHWAYS_SECTIONS.countOverTime).
export const PRISON_POPULATION_PATH = "/system/prison/countOverTime";
export const PRISON_POPULATION_CHART_TITLE = "Prison population over time";

/**
 * Verifies the Pathways prison-population time-series chart renders for the
 * monitored tenant: the chart heading is shown AND the historical data line has
 * drawn. Either missing throws, which fails the synthetic check.
 */
export async function verifyPrisonPopulationChart(
  page: Page,
  { url, stateCode }: SyntheticMonitorConfig,
): Promise<void> {
  log(`opening prison-population chart for ${stateCode}`);
  await page.goto(`${url}${PRISON_POPULATION_PATH}?tenantId=${stateCode}`, {
    waitUntil: "load",
    timeout: TIMEOUT_MS,
  });

  // Chart heading (the <h2 id="chart-title"> — its aria-label/text contains the
  // title). Confirms the right chart is on the page.
  await page
    .getByRole("heading", {
      name: new RegExp(PRISON_POPULATION_CHART_TITLE, "i"),
    })
    .first()
    .waitFor({ state: "visible", timeout: TIMEOUT_MS });

  // The rendered historical line confirms the chart actually drew with data,
  // not just an empty/loading frame.
  await page
    .locator(".VizPathways__historicalLine")
    .first()
    .waitFor({ state: "visible", timeout: TIMEOUT_MS });
}
