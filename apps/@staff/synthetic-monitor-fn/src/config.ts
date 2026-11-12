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

// Runtime configuration for the synthetic sign-in monitor. All values are
// injected by the Terraform component at deploy time. The same bundle is
// deployed once per state — STATE_CODE is what distinguishes the instances and
// selects the per-state credentials + assertions:
//   - STAFF_APP_URL          plain env var (the deployed dashboard URL to test)
//   - STATE_CODE             plain env var (e.g. "US_IA") — selects assertions
//   - STAFF_TEST_USER        mounted from Secret Manager (this state's test user)
//   - STAFF_TEST_PASSWORD    mounted from Secret Manager (this state's password)

export interface SyntheticMonitorConfig {
  /** Deployed staff dashboard URL the monitor signs in to. */
  url: string;
  /** Auth0 test-user email for this state. */
  username: string;
  /** Auth0 test-user password for this state. */
  password: string;
  /** State this instance monitors (e.g. "US_IA"). Selects per-state assertions. */
  stateCode: string;
}

const REQUIRED_ENV_VARS = [
  "STAFF_APP_URL",
  "STATE_CODE",
  "STAFF_TEST_USER",
  "STAFF_TEST_PASSWORD",
] as const;

const STATE_CODE_PATTERN = /^US_[A-Z]{2}$/;

/**
 * Reads + validates the monitor's configuration from the environment. Throws a
 * descriptive error (which fails the synthetic check) when anything is missing,
 * so a misconfigured deploy surfaces as a clear failure rather than a confusing
 * navigation timeout.
 */
export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): SyntheticMonitorConfig {
  const missing = REQUIRED_ENV_VARS.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}`,
    );
  }

  // The state code becomes part of local file paths and GCS object names
  // (failure screenshots and HARs), so reject anything but a state code.
  const stateCode = env["STATE_CODE"] as string;
  if (!STATE_CODE_PATTERN.test(stateCode)) {
    throw new Error(
      `STATE_CODE must look like "US_XX", got ${JSON.stringify(stateCode)}`,
    );
  }

  return {
    url: env["STAFF_APP_URL"] as string,
    username: env["STAFF_TEST_USER"] as string,
    password: env["STAFF_TEST_PASSWORD"] as string,
    stateCode,
  };
}
