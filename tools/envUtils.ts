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

/// <reference path="dotenv-stringify.d.ts" />

import "zx/globals"; // get access to $ function

$.verbose = false;

import dotenv from "dotenv";
import stringify from "dotenv-stringify";
import fs from "fs";
import { ArgumentParser } from "argparse";

export function parseArgs(validEnvNames: Array<string>) {
  const parser = new ArgumentParser({
    description: "Load environment variables from Google Secret Manager",
  });

  parser.add_argument("-e", "--env", {
    dest: "envs",
    action: "extend",
    nargs: "+",
    choices: validEnvNames,
    required: true,
    type: "str",
    help: "Environments to load. Multiples will be processed in specified order to support overrides.",
  });

  parser.add_argument("-f", "--filename", {
    dest: "filename",
    default: ".env",
    help: "Name of dotenv file to write",
  });

  type Args = {
    envs: Array<string>;
    filename: string;
  };

  return parser.parse_args() as Args;
}

const secretsProject = "recidiviz-dashboard-staging";

export async function getSecret(secretName: string) {
  return (
    await $`gcloud secrets versions access latest --secret=${secretName} --project ${secretsProject}`
  ).toString();
}

/**
 * Given an array of envs (secret names) and an output path,
 * reads each env from Google Secret Manager, merges them and writes to a dotenv file.
 * To manually override any variables contained in the secrets (or arbitrarily add new ones),
 * include them as a third argument.
 */
export async function makeDotenv(
  envs: Array<string>,
  outputPath: string,
  manualOverrides: Record<string, string> = {},
) {
  console.log("Fetching environment variables ...");

  const finalVars: Record<string, string> = {};

  for (const env of envs) {
    const value = await getSecret(env);
    if (!value) {
      console.log(`env ${env} contains no variables. Continuing ...`);
      continue;
    }

    const vars = dotenv.parse(value);

    Object.assign(finalVars, vars);
    console.log(`Fetched variables for ${env}`);
  }

  fs.writeFileSync(outputPath, stringify({ ...finalVars, ...manualOverrides }));

  console.log(`updated ${outputPath}`);
}
