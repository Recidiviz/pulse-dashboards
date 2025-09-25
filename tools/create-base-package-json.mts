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

import fs from "fs/promises";
import path from "path";

const projectRoot = process.argv[2];
const rootDir = process.env.NX_WORKSPACE_ROOT ?? "";

const projectPackagePath = path.join(projectRoot, "package.json");
const repoPackagePath = path.join(rootDir, "package.json");

const repoPackageContents = JSON.parse(
  await fs.readFile(repoPackagePath, { encoding: "utf8" }),
);

const projectPackageJsonContents = {
  dependencies: {
    // these are not parts of the application but we use them in the docker container
    extensionless: repoPackageContents.dependencies.extensionless,
    prisma: repoPackageContents.dependencies.prisma,
    // This is a peer dependency of the @prisma/adapter-pg package
    pg: repoPackageContents.dependencies.pg,
    // Because of the way this is being imported in the generated Prisma client, esbuild doesn't pick up that it is a dependency (it resolves to @prisma/client/runtime/query_compiler_bg.postgresql.wasm instead of @prisma/client)
    "@prisma/client": repoPackageContents.dependencies["@prisma/client"],
  },
};

await fs.writeFile(
  projectPackagePath,
  JSON.stringify(projectPackageJsonContents, undefined, 2),
);
