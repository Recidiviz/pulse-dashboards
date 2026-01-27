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

import { ExecutorContext, logger, targetToTargetString } from "@nx/devkit";
import { spawnSync } from "child_process";

import { SOPS_ENV_PREFIX } from "./sops-env";
import { decryptSopsFile, getSopsPathsForTask } from "./utils";

export interface DelegateExecutorOptions {
  prefixedTarget: string; // The requires-sops-env: prefixed target name
}

function delegateToTarget(
  project: string,
  target: string,
  configuration: string | undefined,
  overrides: { [k: string]: unknown },
): boolean {
  try {
    // Build the target string
    const targetString = targetToTargetString({
      project,
      target,
      configuration,
    });

    // Build arguments as an array to avoid shell escaping issues
    const args = ["run", targetString];

    // Add override arguments
    // No need for JSON.stringify since we're using spawnSync with shell: false
    for (const [key, value] of Object.entries(overrides)) {
      args.push(`--${key}=${String(value)}`);
    }

    logger.verbose(`Running: nx ${args}`);

    // Use spawnSync with shell: false to avoid shell interpretation
    const result = spawnSync("nx", args, {
      stdio: "inherit",
      shell: false,
    });

    if (result.error) {
      throw result.error;
    }

    return result.status === 0;
  } catch (error) {
    logger.error(`Failed to run target ${target} for project ${project}:`);
    logger.error(error);
    return false;
  }
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
export default async function runSopsDelegateExecutor(
  options: DelegateExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const projectName = context.projectName;

  if (!projectName) {
    logger.error("No project name found in context");
    return { success: false };
  }

  const { prefixedTarget, ...argsToForward } = options;

  const projectConfig = context.projectsConfigurations?.projects[projectName];
  const projectRoot = projectConfig?.root;
  const targetConfig = projectConfig.targets?.[prefixedTarget];

  const configurationName =
    context.configurationName || targetConfig?.defaultConfiguration;

  // Skip if explicitly disabled
  if (process.env["NX_SKIP_SOPS"] === "true") {
    logger.verbose("SOPS decryption skipped (NX_SKIP_SOPS=true)");
    // Still run the target even if SOPS is skipped
    try {
      delegateToTarget(
        projectName,
        options.prefixedTarget,
        configurationName,
        argsToForward,
      );
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // Determine source project (could be current project or referenced via tag)
  const sourceProjectName = projectName;
  const sourceProjectRoot = projectRoot;

  if (!sourceProjectRoot) {
    logger.error(
      `No project root found for ${sourceProjectName}, skipping SOPS loading`,
    );
    return { success: false };
  }

  // Extract unprefixed target name for SOPS file lookup
  const unprefixedTarget = options.prefixedTarget.replace(SOPS_ENV_PREFIX, "");

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
      const success = delegateToTarget(
        projectName,
        prefixedTarget,
        configurationName,
        argsToForward,
      );

      return { success };
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
    const success = delegateToTarget(
      projectName,
      prefixedTarget,
      configurationName,
      argsToForward,
    );

    return { success };
  } catch (error) {
    logger.error(`Failed to run delegate target!`);
    logger.error(error);
    return { success: false };
  }
}
