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

import { readFileSync } from "fs";
import { join } from "path";

const tsconfig = JSON.parse(
  readFileSync(
    join(new URL(".", import.meta.url).pathname, "../tsconfig.base.json"),
  ).toString(),
);

const invalidImportPaths = Object.keys(tsconfig.compilerOptions.paths).filter(
  (path) => !path.startsWith("~"),
);

if (invalidImportPaths.length) {
  console.error(
    `Invalid import paths: ${invalidImportPaths.join(", ")}. All paths must start with ~`,
  );
  process.exitCode = 1;
}
