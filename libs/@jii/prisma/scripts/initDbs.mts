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

import { $ } from "zx";

import { getEnabledStates } from "./utils";

$.verbose = false;

for (const state of getEnabledStates()) {
  console.log(`creating DB for ${state}`);
  try {
    // eslint-disable-next-line no-await-in-loop
    await $`createdb ${state} -h localhost -p ${process.env["DEV_PORT"]}`.pipe(
      process.stdout,
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes("already exists")) {
      console.log("already exists");
      continue;
    }
    throw e;
  }
}
