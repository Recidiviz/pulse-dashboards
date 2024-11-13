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

console.log("Creating package.json template ...");

const packageTemplate = {
  scripts: {
    start: "node --import=extensionless/register server/index.js",
    "start-e2e": "env-cmd -f .env.offline yarn start",
  },
  dependencies: {},
};

// we need to seed this template with some extra dependencies from the repo

const rootDir = process.env.NX_WORKSPACE_ROOT ?? "";
const repoPackagePath = path.join(rootDir, "package.json");
const projectPackagePath = path.join(__dirname, "../package.json");

const repoPackageContents = JSON.parse(
  await fs.readFile(repoPackagePath, { encoding: "utf8" }),
);

packageTemplate.dependencies = {
  // this is not part of the application but we use it in yarn start
  extensionless: repoPackageContents.dependencies.extensionless,
  // this we need to run e2e tests against the build
  "env-cmd": repoPackageContents.dependencies["env-cmd"],
  // these are used by the application but esbuild just doesn't pick up on them for some reason
  express: repoPackageContents.dependencies.express,
  "path-to-regexp": repoPackageContents.dependencies["path-to-regexp"],
};

await fs.writeFile(
  projectPackagePath,
  JSON.stringify(packageTemplate, undefined, 2),
);
