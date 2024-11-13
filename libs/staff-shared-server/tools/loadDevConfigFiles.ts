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

console.log("Updating service account files...");

// these files need to be in the project root for GCP credential detection to work
const projectRootDir = path.join(__dirname, "../");
// but because they are also referenced directly in code,
// they should be inside src as well. giving them their own directory is cleaner
const srcConfigsDir = path.join(__dirname, "../src/configs");

await Promise.all(
  Object.entries(serviceAccountSecretsToFiles).map(
    async ([secret, filename]) => {
      const fileContents = await getSecret(secret);

      if (!fileContents) {
        throw new Error(`unexpected empty config secret: ${secret}`);
      }

      await Promise.all([
        fs.writeFile(path.join(projectRootDir, filename), fileContents),
        fs.writeFile(path.join(srcConfigsDir, filename), fileContents),
      ]);
    },
  ),
);
