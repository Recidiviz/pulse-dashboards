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

// The check each state's monitor runs after sign-in, customizable per state.
//
// After signIn, the monitor runs the verification for STATE_CODE. The default
// is the generic Workflows caseload check; override a state in
// STATE_VERIFICATIONS when it needs a different or additional flow. A
// verification returns normally on success and throws to fail the synthetic
// check.

import type { Page } from "playwright-core";

import type { SyntheticMonitorConfig } from "./config";
import { verifyPrisonPopulationChart } from "./pathways";
import { verifyWorkflowsCaseload } from "./workflows";

export type Verification = (
  page: Page,
  config: SyntheticMonitorConfig,
) => Promise<void>;

/** Applied to any state without an explicit override below. */
export const DEFAULT_VERIFICATION: Verification = verifyWorkflowsCaseload;

/**
 * Per-state overrides, keyed by STATE_CODE (e.g. "US_IA"). Compose with the
 * exported building blocks (e.g. verifyWorkflowsCaseload from ./workflows) or
 * write a bespoke flow. To cover several product surfaces in one state, run
 * them in sequence inside its verification, so the state keeps a single
 * sign-in, uptime check, and alert:
 *
 *   US_IA: async (page, config) => {
 *     await verifyWorkflowsCaseload(page, config);
 *     await page.getByRole("link", { name: "Tasks" }).click();
 *     // ...extra assertions
 *   },
 */
export const STATE_VERIFICATIONS: Record<string, Verification> = {
  // New York is a Pathways state — verify the prison-population chart renders
  // instead of the (absent) Workflows caseload.
  US_NY: verifyPrisonPopulationChart,
};

export function verificationForState(stateCode: string): Verification {
  return STATE_VERIFICATIONS[stateCode] ?? DEFAULT_VERIFICATION;
}
