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
 * Syncs environment variables from SOPS to EAS (Expo Application Services)
 *
 * This script reads environment variables from process.env (populated by SOPS)
 * and pushes them to EAS for cloud builds.
 *
 * Usage:
 *   nx sync-to-eas @meetings/app
 *   nx sync-to-eas @meetings/app -c staging
 *   nx sync-to-eas @meetings/app -c production
 */

import { $, chalk } from "zx";

const SYNCABLE_PREFIXES = ["EXPO_PUBLIC_", "SENTRY_AUTH_TOKEN"];

// Map Nx configuration to EAS environment
const NX_TO_EAS_ENV_MAP: Record<string, string> = {
  development: "development",
  staging: "preview",
  production: "production",
};

function shouldSyncVar(key: string): boolean {
  return SYNCABLE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function getVisibility(key: string): "plaintext" | "sensitive" {
  // EXPO_PUBLIC_ vars are bundled into client code, so they're public
  if (key.startsWith("EXPO_PUBLIC_")) {
    return "plaintext";
  }
  // Build-time secrets like SENTRY_AUTH_TOKEN should be sensitive
  return "sensitive";
}

// Get Nx configuration from argv
const nxConfig = process.argv[3] || "development"; // argv[2] is the script path
const easEnvironment = NX_TO_EAS_ENV_MAP[nxConfig];

if (!easEnvironment) {
  console.error(`Invalid configuration: ${nxConfig}`);
  console.error(
    `Valid configurations: ${Object.keys(NX_TO_EAS_ENV_MAP).join(", ")}`,
  );
  process.exit(1);
}

console.log(
  chalk.blue(
    `Syncing from Nx config "${nxConfig}" to EAS environment "${easEnvironment}"\n`,
  ),
);

// Filter env vars to sync
const varsToSync = Object.entries(process.env)
  .filter(([key]) => shouldSyncVar(key))
  .filter(([, value]) => value); // Skip empty values

console.log(chalk.blue(`Found ${varsToSync.length} variables to sync\n`));

let successCount = 0;
let failCount = 0;

for (const [key, value] of varsToSync) {
  const visibility = getVisibility(key);
  console.log(chalk.gray(`Syncing ${key} (${visibility})...`));

  try {
    // eslint-disable-next-line no-await-in-loop
    await $`eas env:create \
      --name ${key} \
      --value ${value} \
      --environment ${easEnvironment} \
      --scope project \
      --visibility ${visibility} \
      --force \
      --non-interactive`.quiet();

    successCount++;
    console.log(chalk.green(`  ✓ ${key}`));
  } catch (error) {
    failCount++;
    console.error(chalk.red(`  ✗ Failed to sync ${key}`));
    if (error instanceof Error) {
      console.error(chalk.red(`    Error: ${error.message}`));
    }
  }
}

console.log(chalk.green(`\n✓ Successfully synced ${successCount} variables`));
if (failCount > 0) {
  console.error(chalk.red(`✗ Failed to sync ${failCount} variables`));
  process.exit(1);
}
