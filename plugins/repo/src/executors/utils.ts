// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { workspaceRoot } from "@nx/devkit";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export interface DecryptedEnv {
  [key: string]: string;
}

/**
 * Parse YAML content into environment variables
 * Converts all top-level keys to strings for process.env
 */
export function parseYamlEnv(content: string): DecryptedEnv {
  try {
    // Try to load yaml module
    const yaml = require("yaml");
    const parsed = yaml.parse(content);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("YAML content is not an object");
    }

    const env: DecryptedEnv = {};

    // Convert all top-level keys to strings
    for (const [key, value] of Object.entries(parsed)) {
      // Convert value to string for process.env
      if (value === null || value === undefined) {
        env[key] = "";
      } else if (typeof value === "object") {
        // Serialize objects as JSON
        env[key] = JSON.stringify(value);
      } else {
        env[key] = String(value);
      }
    }

    return env;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse YAML: ${message}`);
  }
}

export function decryptSopsFile(filePath: string): DecryptedEnv {
  const absolutePath = filePath.startsWith("/")
    ? filePath
    : join(workspaceRoot, filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`SOPS encrypted file not found: ${absolutePath}`);
  }

  // Check if sops is installed
  try {
    execSync("which sops", { stdio: "pipe" });
  } catch {
    throw new Error(
      "SOPS is not installed. Install it with: brew install sops (macOS) or see https://github.com/getsops/sops",
    );
  }

  try {
    const decrypted = execSync(`sops -d "${absolutePath}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
      },
    });

    // Parse as YAML instead of env file format
    return parseYamlEnv(decrypted);
  } catch (error: unknown) {
    const stderr = (error as { stderr?: Buffer })?.stderr?.toString() || "";
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to decrypt SOPS file: ${message}\n${stderr}`);
  }
}

/**
 * Get SOPS file paths for a task in priority order (mirroring Nx's env file behavior)
 * Returns paths from lowest to highest priority, so later files override earlier ones
 *
 * Example: target="test-echo", configuration="staging"
 * Returns (in order):
 *   - env.enc.yaml (base)
 *   - env.test-echo.enc.yaml (target-specific)
 *   - env.staging.enc.yaml (configuration-specific)
 *   - env.test-echo.staging.enc.yaml (target+configuration-specific)
 */
export function getSopsPathsForTask(
  projectRoot: string,
  target: string,
  configuration?: string,
): string[] {
  const identifiers: string[] = [];

  // Configuration-specific identifier (like test-echo.staging)
  if (configuration) {
    identifiers.push(`${target}.${configuration}`);
    identifiers.push(configuration);
  }

  // Target-specific identifier (like test-echo)
  identifiers.push(target);

  // Base identifier (no suffix)
  identifiers.push("");

  const projectDir = join(workspaceRoot, projectRoot);
  const sopsFiles: string[] = [];

  // Check in reverse order so we return lowest priority first
  for (let i = identifiers.length - 1; i >= 0; i--) {
    const identifier = identifiers[i];
    const fileName = identifier ? `env.${identifier}.enc.yaml` : "env.enc.yaml";
    const filePath = join(projectDir, fileName);

    if (existsSync(filePath)) {
      sopsFiles.push(filePath);
    }
  }

  return sopsFiles;
}
