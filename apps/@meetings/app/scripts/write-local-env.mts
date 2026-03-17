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
 * Writes environment variables from SOPS-encrypted YAML files to .env.local
 *
 * This script decrypts the appropriate sops-env files and
 * writes the result to .env.local for local development.
 *
 * NX Configuration is determined by NX_TASK_TARGET_CONFIGURATION environment variable.
 */

import { writeFileSync } from "node:fs";
import * as path from "node:path";

import { workspaceRoot } from "@nx/devkit";
import { fileURLToPath } from "url";
import { chalk } from "zx";

// eslint-disable-next-line @nx/enforce-module-boundaries
import { loadEnvFilesForTask } from "~repo";

// Get the app directory (parent of scripts/)
const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.relative(workspaceRoot, appDir);
const envLocalPath = path.join(appDir, ".env.local");

console.log(chalk.blue("Writing .env.local...\n"));

// Read configuration from environment (default to "dev")
const configuration = process.env["NX_TASK_TARGET_CONFIGURATION"] || "dev";
console.log(chalk.gray(`Configuration: ${configuration}`));

// Determine SOPS file suffix (contractor vs regular)
const suffix = process.env["NX_SOPS_USE_CONTRACTOR_ENV"]
  ? ".contractor.enc.yaml"
  : ".enc.yaml";

try {
  // Load all env files in one consolidated call
  const { envVars, sopsFiles, plaintextFiles } = loadEnvFilesForTask({
    projectRoot,
    configuration,
    suffix,
  });

  console.log(chalk.gray(`\nLoaded ${sopsFiles.length} encrypted file(s):`));
  sopsFiles.forEach((file) => {
    console.log(chalk.gray(`  - ${path.basename(file)}`));
  });

  console.log(
    chalk.gray(`\nLoaded ${plaintextFiles.length} plaintext file(s):`),
  );
  plaintextFiles.forEach((file) => {
    console.log(chalk.gray(`  - ${path.basename(file)}`));
  });

  if (sopsFiles.length === 0 && plaintextFiles.length === 0) {
    console.log(
      chalk.yellow("\nNo env files found, skipping .env.local write"),
    );
    process.exit(0);
  }

  console.log(
    chalk.blue(`\nTotal environment variables: ${Object.keys(envVars).length}`),
  );

  // Write to .env.local
  const envEntries = Object.entries(envVars).map(
    ([key, value]) => `${key}=${value}`,
  );
  const envContent = envEntries.join("\n") + "\n";
  writeFileSync(envLocalPath, envContent, "utf-8");

  console.log(
    chalk.green(`\n✓ Successfully wrote .env.local to ${envLocalPath}`),
  );
  console.log(chalk.gray(`  ${envEntries.length} variables written`));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`\n✗ Failed to write .env.local: ${message}`));
  process.exit(1);
}
