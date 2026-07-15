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

import { readFileSync } from "fs";
import { join } from "path";

const tsconfig = JSON.parse(
  readFileSync(
    join(new URL(".", import.meta.url).pathname, "../tsconfig.base.json"),
  ).toString(),
);

// Allowlist the paths for the custom prisma clients (@prisma) and third-party
// modules without bundler-resolvable types (object.hasown).
//
// TODO(OBT-36753): remove the firebase-admin and express-rate-limit entries once
// those deps are upgraded. Their tsconfig.base.json `paths` redirects exist only
// because firebase-admin@10 and express-rate-limit@6 expose subpath types via the
// legacy `typesVersions` field / lack a `types` export condition, which
// moduleResolution "bundler" ignores. firebase-admin >= 14 and express-rate-limit
// v7 add a proper `types` condition, after which the redirects (and these two
// allowlist entries) can be deleted.
const invalidImportPaths = Object.keys(tsconfig.compilerOptions.paths).filter(
  (path) =>
    !path.startsWith("~") &&
    !path.startsWith("@prisma") &&
    !path.startsWith("object.hasown") &&
    !path.startsWith("firebase-admin") &&
    !path.startsWith("express-rate-limit"),
);

if (invalidImportPaths.length) {
  console.error(
    `Invalid import paths: ${invalidImportPaths.join(", ")}. All paths must start with ~`,
  );
  process.exitCode = 1;
}
