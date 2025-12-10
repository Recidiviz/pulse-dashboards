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

import { ExecutorContext, logger } from "@nx/devkit";
import { execSync } from "child_process";

import { decryptSopsFile, getSopsPathsForTask } from "./utils";

export interface DelegateExecutorOptions {
  prefixedTarget: string; // The requires-sops-env: prefixed target name
}

/**
 * Delegate executor that loads SOPS environment variables and delegates to the prefixed target
 *
 * This executor:
 * 1. Determines the environment from the Nx task configuration
 * 2. Decrypts the appropriate SOPS YAML file
 * 3. Loads variables into process.env (inherited by child process)
 * 4. Runs the prefixed target as a child process
 */
export default async function runExecutor(
  options: DelegateExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const projectName = context.projectName;

  if (!projectName) {
    logger.error("No project name found in context");
    return { success: false };
  }

  const projectConfig = context.projectsConfigurations?.projects[projectName];
  const projectRoot = projectConfig?.root;
  const configurationName = context.configurationName || "development";

  // Skip if explicitly disabled
  if (process.env["NX_SKIP_SOPS"] === "true") {
    logger.verbose("SOPS decryption skipped (NX_SKIP_SOPS=true)");
    // Still run the target even if SOPS is skipped
    try {
      const command = `nx ${options.prefixedTarget} ${projectName} --configuration ${configurationName}`;
      execSync(command, { stdio: "inherit" });
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // Determine source project (could be current project or referenced via tag)
  const sourceProjectName = projectName;
  const sourceProjectRoot = projectRoot;

  if (!sourceProjectRoot) {
    logger.verbose(
      `No project root found for ${sourceProjectName}, skipping SOPS loading`,
    );
    // Still run the target even if no SOPS files
    try {
      const command = `nx ${options.prefixedTarget} ${projectName} --configuration ${configurationName}`;
      execSync(command, { stdio: "inherit" });
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // Extract unprefixed target name for SOPS file lookup
  const unprefixedTarget = options.prefixedTarget.replace(
    "requires-sops-env:",
    "",
  );

  // Get SOPS files in priority order (mirroring Nx's env file behavior)
  const sopsFilePaths = getSopsPathsForTask(
    sourceProjectRoot,
    unprefixedTarget,
    configurationName,
  );

  if (sopsFilePaths.length === 0) {
    logger.verbose(
      `No SOPS env files found in ${sourceProjectRoot}, skipping SOPS loading`,
    );
    // Still run the target even if no SOPS files
    try {
      const command = `nx ${options.prefixedTarget} ${projectName} --configuration ${configurationName}`;
      execSync(command, { stdio: "inherit" });
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // Load SOPS files in priority order (later files override earlier ones)
  const envVars: Record<string, string> = {};

  try {
    for (const sopsPath of sopsFilePaths) {
      logger.info(`Decrypting ${sopsPath}`);
      const decryptedYaml = decryptSopsFile(sopsPath);

      // Later files override earlier ones
      Object.assign(envVars, decryptedYaml);
    }

    // Load all variables into process.env (child process will inherit)
    Object.assign(process.env, envVars);

    logger.info(
      `Loaded ${Object.keys(envVars).length} environment variables from ${sopsFilePaths.length} file(s)`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to decrypt SOPS file: ${message}`);
    return { success: false };
  }

  // Run the prefixed target with inherited environment
  try {
    const command = `nx ${options.prefixedTarget} ${projectName} --configuration ${configurationName}`;
    logger.verbose(`Running: ${command}`);
    execSync(command, { stdio: "inherit" });
    return { success: true };
  } catch (error) {
    logger.error(`Failed to run delegate target!`);
    logger.error(error);
    return { success: false };
  }
}
