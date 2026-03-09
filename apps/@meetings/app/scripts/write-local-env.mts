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
 * This script reads all env.*.enc.yaml files in the app directory,
 * extracts the environment variable keys (excluding SOPS metadata),
 * filters process.env to only include those keys, and writes them
 * to .env.local for local development.
 *
 * Usage:
 *   yarn tsx apps/@meetings/app/scripts/write-local-env.mts
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import fg from "fast-glob";
import { fileURLToPath } from "url";
import yaml from "yaml";
import { chalk } from "zx";

// Get the app directory (parent of scripts/)
const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envLocalPath = path.join(appDir, ".env.local");

console.log(chalk.blue("Writing .env.local...\n"));

// Find all encrypted env files
const envFiles = fg.sync("env.*.enc.yaml", { cwd: appDir, absolute: true });

console.log(chalk.gray(`Found ${envFiles.length} env files:`));
envFiles.forEach((file) => {
  console.log(chalk.gray(`  - ${path.basename(file)}`));
});

// Extract unique keys from all env files
const envKeys = new Set<string>();

for (const envFile of envFiles) {
  try {
    const content = readFileSync(envFile, "utf-8");
    const parsed = yaml.parse(content);

    if (parsed && typeof parsed === "object") {
      for (const key of Object.keys(parsed)) {
        // Exclude SOPS metadata keys
        if (key !== "sops") {
          envKeys.add(key);
        }
      }
    }
  } catch (error) {
    console.warn(
      chalk.yellow(`Warning: Failed to parse ${path.basename(envFile)}`),
    );
    if (error instanceof Error) {
      console.warn(chalk.yellow(`  ${error.message}`));
    }
  }
}

console.log(chalk.blue(`\nExtracted ${envKeys.size} unique environment keys`));

// Filter process.env to only include keys found in YAML files
const envEntries: string[] = [];

for (const key of envKeys) {
  const value = process.env[key];
  if (value !== undefined) {
    envEntries.push(`${key}=${value}`);
  }
}

console.log(
  chalk.blue(`Found ${envEntries.length} variables in current environment\n`),
);

// Write to .env.local
const envContent = envEntries.join("\n") + "\n";
writeFileSync(envLocalPath, envContent, "utf-8");

console.log(chalk.green(`✓ Successfully wrote .env.local to ${envLocalPath}`));
console.log(chalk.gray(`  ${envEntries.length} variables written`));
