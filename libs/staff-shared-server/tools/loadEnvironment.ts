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

import path from "path";

// dev scripts are not really integrated with Nx so we can ignore this here
// eslint-disable-next-line @nx/enforce-module-boundaries
import { makeDotenv, parseArgs } from "../../../tools/envUtils";

const validEnvs = [
  // env vars for the dev backend
  "env_dev_server",
  // env vars for the dev backend in demo mode - overrides a few vars in env_dev_server
  "env_dev_demo_server",
];

const args = parseArgs(validEnvs);

makeDotenv(args.envs, path.join(__dirname, `../${args.filename}`), {
  // Manually override environment vars here if needed, e.g.:
  // "RUN_TESTS_HEADLESS": "false"
});
