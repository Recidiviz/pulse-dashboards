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

// Workflows exposes one of two caseload surfaces per tenant: supervision states
// use "Clients", incarceration states use "Residents". We exercise whichever
// this tenant renders.
export const WORKFLOWS_SURFACES = [
  { tab: "Clients", linkPrefix: "/workflows/clients/" },
  { tab: "Residents", linkPrefix: "/workflows/residents/" },
] as const;

type WorkflowsSurface = (typeof WORKFLOWS_SURFACES)[number];

/** Clicks whichever caseload tab the tenant exposes; throws if neither exists. */
async function clickCaseloadTab(page: Page): Promise<WorkflowsSurface> {
  // Wait for the Workflows nav to render before deciding which surface is live.
  await page
    .getByRole("menuitem", { name: /^(Clients|Residents)$/ })
    .first()
    .waitFor({ state: "visible", timeout: TIMEOUT_MS });

  const tabs = WORKFLOWS_SURFACES.map((surface) => ({
    surface,
    locator: page.getByRole("menuitem", { name: surface.tab, exact: true }),
  }));
  const counts = await Promise.all(tabs.map((t) => t.locator.count()));
  const match = tabs.find((_, i) => counts[i] > 0);
  if (!match) {
    throw new Error(
      "No Workflows caseload tab found — expected a Clients or Residents nav item. " +
        "The user may lack Workflows access for this state.",
    );
  }

  await match.locator.first().click();
  return match.surface;
}

// Clears any caseload selection (selections persist server-side per user and
// would otherwise accumulate across runs). `appearTimeoutMs` waits for the
// async-loaded clear control; otherwise its current visibility is checked.
async function clearCaseloadSelection(
  page: Page,
  {
    appearTimeoutMs,
    waitForHidden = false,
    reason,
  }: { appearTimeoutMs?: number; waitForHidden?: boolean; reason: string },
): Promise<void> {
  const clearControl = page.locator(".CaseloadSelect__clear-indicator");
  const visible = appearTimeoutMs
    ? await clearControl
        .waitFor({ state: "visible", timeout: appearTimeoutMs })
        .then(
          () => true,
          () => false,
        )
    : await clearControl.isVisible().catch(() => false);
  if (!visible) {
    log(`no caseload selection to clear (${reason})`);
    return;
  }
  log(`clearing caseload selection (${reason})`);
  await clearControl.click();
  if (waitForHidden) {
    await clearControl
      .waitFor({ state: "hidden", timeout: TIMEOUT_MS })
      .catch(() => undefined);
  }
}

/**
 * Exercises the Workflows caseload for the monitored tenant:
 *   1. open Workflows and click the Clients or Residents tab,
 *   2. open the caseload search dropdown and select the first option, and
 *   3. assert the caseload's people render, each linking into their
 *      workflows profile (e.g. /workflows/clients/<id>).
 *
 * Any missing step throws, which fails the synthetic check.
 */
export async function verifyWorkflowsCaseload(
  page: Page,
  { url, stateCode }: SyntheticMonitorConfig,
): Promise<void> {
  // Land in Workflows for this tenant. tenantId scopes a multi-state
  // (Recidiviz-internal) user to the state being monitored.
  log(`opening Workflows for ${stateCode}`);
  await page.goto(`${url}/workflows?tenantId=${stateCode}`, {
    waitUntil: "load",
    timeout: TIMEOUT_MS,
  });

  const surface = await clickCaseloadTab(page);
  log(`caseload tab: ${surface.tab}`);

  // A previous run's selection carries over (persisted server-side and loaded
  // async after the tab nav), so wait briefly for its clear control and start
  // from a clean slate.
  await clearCaseloadSelection(page, {
    appearTimeoutMs: 8_000,
    reason: "carried-over",
  });

  // Open the caseload search dropdown and select the FIRST option. CaseloadSelect
  // is a react-select multi-select, where a mouse click on an option can register
  // more than once and select several caseloads. The first option is auto-focused
  // when the menu opens, so a single Enter selects exactly it (one discrete
  // action); Escape then closes the menu so nothing else can be added.
  await page.locator(".CaseloadSelect__input-container").click();
  await page
    .getByRole("option")
    .first()
    .waitFor({ state: "visible", timeout: TIMEOUT_MS });
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");

  // Each person should link into their workflows profile.
  const personLinks = page
    .getByRole("main")
    .locator(`a[href^="${surface.linkPrefix}"]`);
  await personLinks.first().waitFor({ state: "visible", timeout: TIMEOUT_MS });
  const count = await personLinks.count();
  if (count < 1) {
    throw new Error(
      `Expected at least one ${surface.tab} profile link (${surface.linkPrefix}…) but found none.`,
    );
  }

  // Clean up our own selection; wait for the cleared state to take effect
  // before the browser closes.
  await clearCaseloadSelection(page, {
    waitForHidden: true,
    reason: "after assertions",
  });
}
