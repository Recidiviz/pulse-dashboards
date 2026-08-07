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

import { ArgumentParser } from "argparse";
import { $ } from "zx";

import { getDevDatabaseUrl } from "../src/utils";
import { getEnabledStates } from "./utils";

$.verbose = false;

const parser = new ArgumentParser({
  description:
    "Starts Prisma Studio against the local dev DB for a single state",
});

parser.add_argument("-s", "--state-code", {
  dest: "stateCode",
  required: true,
  choices: [
    ...getEnabledStates(),
    ...getEnabledStates().map((s) => s.toUpperCase()),
  ],
  help: "State code to open Prisma Studio for",
});

type Args = {
  stateCode: string;
};

const { stateCode } = parser.parse_args() as Args;

console.log(`Starting Prisma Studio for ${stateCode}`);
await $`DATABASE_URL=${getDevDatabaseUrl(stateCode.toLowerCase())} yarn prisma studio`.pipe(
  process.stdout,
);
