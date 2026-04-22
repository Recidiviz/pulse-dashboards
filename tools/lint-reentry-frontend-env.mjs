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

import dotenv from "dotenv";
import { readFileSync } from "fs";
import { relative } from "path";

const violations = [];

for (const file of process.argv.slice(2)) {
  const parsed = dotenv.parse(readFileSync(file));
  for (const key of Object.keys(parsed)) {
    if (!key.startsWith("NEXT_PUBLIC_")) {
      violations.push({ file: relative(process.cwd(), file), key });
    }
  }
}

if (violations.length) {
  console.error(
    "\nERROR: apps/@reentry/frontend/.env* files are bundled into the public Next.js client and MUST NOT contain secrets.",
  );
  console.error("Only NEXT_PUBLIC_-prefixed variables are allowed.\n");
  for (const { file, key } of violations) {
    console.error(`  ${file}  ${key}`);
  }
  console.error(
    "\nMove non-public values to a server-side secret store (e.g. GSM / SOPS) instead.\n",
  );
  process.exit(1);
}
