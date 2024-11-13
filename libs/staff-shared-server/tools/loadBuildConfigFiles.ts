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

import fs from "fs/promises";
import path from "path";

// dev scripts are not really integrated with Nx so we can ignore this here
// eslint-disable-next-line @nx/enforce-module-boundaries
import { getSecret } from "../../../tools/envUtils";
import { serviceAccountSecretsToFiles } from "./serviceAccountSecrets";

// everything in this directory will be copied over by the build process
const deployConfigsDir = path.join(__dirname, "../deploy-configs");
await fs.rm(deployConfigsDir, { recursive: true, force: true });
await fs.mkdir(deployConfigsDir, { recursive: true });

console.log("Updating service account files...");

await Promise.all(
  Object.entries(serviceAccountSecretsToFiles).map(
    async ([secret, filename]) => {
      const fileContents = await getSecret(secret);

      if (!fileContents) {
        throw new Error(`unexpected empty config secret: ${secret}`);
      }

      await fs.writeFile(path.join(deployConfigsDir, filename), fileContents);
    },
  ),
);

console.log("Updating GAE yaml files...");

const appEngineSecretsToFiles = {
  // TODO(#4831): for backwards compatibility, using temporary alternate versions of these secrets;
  // can go back to the standard ones once everyone is safely updated to the new version
  env_gae_staging_tmp_migrate: "gae-staging.yaml",
  env_gae_staging_demo_tmp_migrate: "gae-staging-demo.yaml",
  env_gae_production_tmp_migrate: "gae-production.yaml",
};

await Promise.all(
  Object.entries(appEngineSecretsToFiles).map(async ([secret, filename]) => {
    const fileContents = await getSecret(secret);

    if (!fileContents) {
      throw new Error(`unexpected empty config secret: ${secret}`);
    }

    await fs.writeFile(path.join(deployConfigsDir, filename), fileContents);
  }),
);
