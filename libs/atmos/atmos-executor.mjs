// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

// Usage:
// yarn atmos
// yarn atmos:plan env-secrets -s recidiviz-dashboard-staging--shared-infra
// yarn atmos:apply env-secrets -s recidiviz-dashboard-staging--shared-infra
// GITHUB_TOKEN=$(gh auth token) yarn atmos:vendor-pull

import * as Path from "node:path";

import chalk from "chalk";
import execa from "execa";
import { fileURLToPath } from "url";

import clean from "./clean.mjs";

if (!process.cwd().endsWith("libs/atmos")) {
  process.chdir(Path.dirname(fileURLToPath(import.meta.url)));
}

clean();

const args = [...process.argv.slice(2)];

console.log(chalk.dim("> "), `atmos ${args.join(" ")}`);

execa.sync("atmos", args, {
  stdio: "inherit",
  env: { FORCE_COLOR: "1" },
});
