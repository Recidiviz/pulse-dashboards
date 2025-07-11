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
  // env vars for the dev frontend
  "env_dev_spa",
  // env vars for running with a local Python backend - overrides a var in env_dev_spa
  "env_dev_be_spa",
  // env vars for the local dev frontend in demo mode - overrides a few vars in env_dev_spa
  "env_dev_demo_spa",
  // env vars to run the e2e tests
  "env_e2e",
  // env vars to build the app for the deployed frontend staging environment
  "env_staging",
  // env vars to build the app for the deployed frontend staging demo environment
  "env_staging_demo",
  // env vars to build the app for the deployed frontend production environment
  "env_production",
  // env vars to sync content from the Pathways content google sheet
  "env_sync_content",
  // env vars to load local fixtures to staging demo collections in Firestore
  "env_demo_fixtures_staging",
  // env vars to load local fixtures to production demo collections in Firestore
  "env_demo_fixtures_production",
];

const args = parseArgs(validEnvs);

makeDotenv(args.envs, path.join(__dirname, `../${args.filename}`), {
  // Manually override environment vars here if needed, e.g.:
  // "RUN_TESTS_HEADLESS": "false"
});
