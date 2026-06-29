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

/* eslint-disable no-await-in-loop */

import inquirer from "inquirer";

/**
 * Run a service deploy, logging a uniform `Deploying <name>...` line. Returns `true` once the
 * task succeeds (the caller records the deploy). On failure the user is prompted to retry; the
 * loop only continues while they answer yes, and returns `false` if they decline.
 *
 * The `task` callback owns the actual deploy commands (and any per-iteration logging it
 * needs). Builds that must run once should happen in the caller, before this is invoked.
 */
export async function deployWithRetry(
  displayName: string,
  task: () => Promise<void>,
): Promise<boolean> {
  for (;;) {
    console.log(`Deploying ${displayName}...`);
    try {
      await task();
      return true;
    } catch (e) {
      const { retry } = (await inquirer.prompt({
        type: "confirm",
        name: "retry",
        message: `${displayName} deploy failed with error: ${String(e)}. Retry?`,
        default: false,
      })) as { retry: boolean };
      if (!retry) return false;
    }
  }
}
