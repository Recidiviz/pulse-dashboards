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

import { getLocalDatabaseUrl } from "../src/utils";
import { getEnabledStates } from "./utils";

$.verbose = false;

const parser = new ArgumentParser({
  description:
    "Runs a Prisma CLI command against every enabled state's database",
});

parser.add_argument("--prisma-cmd", {
  dest: "prismaCmd",
  required: true,
  help: 'Prisma CLI command (and args) to run for each state, e.g. "migrate dev" or "migrate reset"',
});

type Args = {
  prismaCmd: string;
};

const [{ prismaCmd }, extraArgs] = parser.parse_known_args() as [
  Args,
  string[],
];
const prismaArgs = [...prismaCmd.split(" "), ...extraArgs];

// we don't actually develop against the default db but we may want to use it for e.g. prisma generate
// .stdio("ignore") closes stdin so Prisma sees a non-TTY environment and fails fast on
// missing required args instead of hanging on an interactive prompt.
await $`DATABASE_URL=${getLocalDatabaseUrl("postgres")} yarn prisma ${prismaArgs}`
  .stdio("ignore")
  .pipe(process.stdout);

// try doing this in parallel
await Promise.all(
  getEnabledStates().map(async (state) => {
    console.log(`Running "prisma ${prismaCmd}" for ${state}`);
    await $`DATABASE_URL=${getLocalDatabaseUrl(state)} yarn prisma ${prismaArgs}`
      .stdio("ignore")
      .pipe(process.stdout);
  }),
);

// ensure the script doesn't hang once all the work is done
process.exit(0);
