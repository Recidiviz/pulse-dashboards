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

import { $ } from "zx";

/** Abort the deploy if the working tree has uncommitted changes. */
export async function checkCleanRepo(): Promise<void> {
  if ((await $`git status --porcelain`).stdout.trim() !== "") {
    console.error(
      "The git repo contains uncommitted changes. Make sure the repo is clean before deploying.",
    );
    process.exit(1);
  }
}

/**
 * Update gcloud ADC and Firebase CLI credentials if not already logged in. We don't
 * check the output of the command because without credentials, something will fail
 * later on.
 */
export async function checkCredentials(): Promise<void> {
  console.log("Checking gcloud ADC and Firebase CLI credentials...");
  try {
    await $`gcloud auth application-default print-access-token --quiet`;
  } catch {
    await $`gcloud auth login --update-adc`;
  }

  try {
    await $`firebase projects:list > /dev/null`;
  } catch {
    await $`firebase login --reauth`;
  }
}
