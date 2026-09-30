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

/**
 * Writes a release version into app.config.ts's RELEASE_VERSION line, in place
 * and uncommitted.
 *
 * Both publish paths need this and neither commits the result: `eas build` (the
 * native release workflow) and `eas update` (the OTA workflow) each package the
 * working tree as-is, and the version is excluded from the fingerprint, so the
 * edit is invisible to OTA compatibility.
 *
 * It lives in one place because of the check at the bottom. If that line is
 * ever renamed, a silent no-op would ship the 0.0.0 placeholder to a store or a
 * channel; two copies of the guard would drift, and a drifted guard is worse
 * than none.
 *
 * Usage: npx tsx scripts/write-release-version.mts 0.9.1
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../app.config.ts",
);

const RELEASE_VERSION_LINE = /^const RELEASE_VERSION: string = .*$/m;

const version = process.argv[2];

if (!version) {
  console.error("Usage: write-release-version.mts <version>");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`'${version}' is not a MAJOR.MINOR.PATCH version.`);
  process.exit(1);
}

if (version === "0.0.0") {
  console.error(
    "0.0.0 is the placeholder app.config.ts commits; refusing to ship it as a release version.",
  );
  process.exit(1);
}

const source = readFileSync(CONFIG_PATH, "utf8");

if (!RELEASE_VERSION_LINE.test(source)) {
  console.error(
    "Could not find the RELEASE_VERSION line in app.config.ts — it has changed shape. " +
      "Refusing to build at the placeholder version.",
  );
  process.exit(1);
}

const expectedLine = `const RELEASE_VERSION: string = "${version}";`;

writeFileSync(CONFIG_PATH, source.replace(RELEASE_VERSION_LINE, expectedLine));

// Read it back rather than trusting the replace, so a version that did not land
// fails the run instead of shipping the placeholder.
if (!readFileSync(CONFIG_PATH, "utf8").includes(expectedLine)) {
  console.error(
    `app.config.ts does not declare version ${version} after writing it.`,
  );
  process.exit(1);
}

console.log(`app.config.ts now declares version ${version}.`);
