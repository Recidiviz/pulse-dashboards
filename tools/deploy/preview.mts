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

import { assertNever } from "assert-never";
import inquirer from "inquirer";
import { $ } from "zx";

import { jiiProject } from "./config.mts";
import { requestPamDeployGrant } from "./pam.mjs";
import { PreviewDeployEnv } from "./types.mts";

const pamProject: Record<PreviewDeployEnv, string> = {
  "preview (staff frontend only)": "recidiviz-dashboard-stag-e1108",
  "preview (Opportunities frontend only)": jiiProject("staging"),
};

/**
 * Build the specified frontend and deploy it to an ephemeral Firebase preview channel,
 * then exit — preview deploys touch nothing else.
 */
export async function runPreviewDeploy(env: PreviewDeployEnv): Promise<void> {
  const { previewAppName, expiration } = (await inquirer.prompt([
    {
      name: "previewAppName",
      message:
        "Enter a name for your preview app (letters, digits, and hyphens only):",
      validate: (name: string) => /^[a-zA-Z0-9-]+$/.test(name),
    },
    {
      name: "expiration",
      message: "How long should it last?",
      choices: ["7d", "1d", "1h"],
      default: "7d",
      type: "list",
    },
  ])) as { previewAppName: string; expiration: string };

  // Request access to deploy the specified app, and wait for the permissions to propagate
  await requestPamDeployGrant(pamProject[env]);

  switch (env) {
    case "preview (staff frontend only)":
      await $`nx build staff --configuration staging`.pipe(process.stdout);
      await $`firebase hosting:channel:deploy ${previewAppName} -P staging --expires ${expiration}`.pipe(
        process.stdout,
      );
      return;
    case "preview (Opportunities frontend only)":
      await $`nx deploy-preview jii ${previewAppName} --expires ${expiration}`.pipe(
        process.stdout,
      );
      return;
    default:
      assertNever(env);
  }
}
