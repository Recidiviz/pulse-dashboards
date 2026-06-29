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

import inquirer from "inquirer";

import { services } from "./services/index.mts";
import type { DeployEnv, SelectedServices } from "./types.mts";

/** Ask which environment to deploy. */
export async function promptDeployEnv(): Promise<DeployEnv> {
  const { deployEnv } = (await inquirer.prompt({
    type: "list",
    choices: [
      "staging",
      "preview (staff frontend only)",
      "demo",
      "production",
    ] satisfies DeployEnv[],
    name: "deployEnv",
    message: "Which environment are you deploying?",
    default: "staging",
  })) as { deployEnv: DeployEnv };
  return deployEnv;
}

/**
 * Present the service-selection checkbox — offering each service available in `deployEnv`,
 * pre-checked per its {@link ServiceDefinition.defaultChecked} — and return the set of selected
 * service keys.
 */
export async function promptServices(
  deployEnv: DeployEnv,
): Promise<SelectedServices> {
  const available = Object.entries(services).filter(([, svc]) =>
    svc.environments.includes(deployEnv),
  );

  const { deployServices } = (await inquirer.prompt({
    type: "checkbox",
    name: "deployServices",
    message:
      "Deploying selected services. Press 'Enter' to proceed or modify your selections.",
    choices: available.map(([, svc]) => ({
      name: svc.displayName,
      checked: (svc.defaultChecked ?? svc.environments).includes(deployEnv),
    })),
  })) as { deployServices: string[] };

  // Map the chosen display names back to their service keys.
  return new Set(
    available
      .filter(([, svc]) => deployServices.includes(svc.displayName))
      .map(([key]) => key),
  );
}
