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
import {
  decryptSopsFile,
  getPlaintextEnvPathsForTask,
  getSopsPathsForTask,
  interpolatePath,
  loadDotenvFile,
} from "./utils";

export interface DelegateExecutorOptions {
  prefixedTarget: string; // The requires-sops-env: prefixed target name
}

export const SOPS_ENV_METADATA_NAME = "sops-env";

export interface SopsEnvMetadata {
  // Reference another Nx project to use its env files
  "override-sops-env-project"?: string;
  // Additional SOPS encrypted files to load
  "additional-sops-env-files"?: string[];
  // Additional unencrypted .env files to load
  "additional-dotenv-files"?: string[];
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

    // Extract positional arguments (typically passed as "_" key by nx)
    const positionalArgs = overrides["_"];
    const namedOverrides = { ...overrides };
    delete namedOverrides["_"];

    // Add named override arguments
    for (const [key, value] of Object.entries(namedOverrides)) {
      if (Array.isArray(value)) {
        // Handle array values by adding multiple instances of the flag
        for (const item of value) {
          args.push(`--${key}=${String(item)}`);
        }
      } else {
        args.push(`--${key}=${String(value)}`);
      }
    }

    // Add positional arguments at the end
    if (Array.isArray(positionalArgs)) {
      args.push(...positionalArgs.map(String));
    } else if (positionalArgs !== undefined) {
      args.push(String(positionalArgs));
    }

    logger.verbose(`Running: nx ${args.join(" ")}`);

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
 * 2. Decrypts the appropriate SOPS YAML file(s) and .env files
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

  // Read sops-env metadata from project and target config
  // Target metadata takes precedence over project metadata
  const projectSopsEnvMetadata = ((
    projectConfig?.metadata as Record<string, unknown>
  )?.[SOPS_ENV_METADATA_NAME] || {}) as SopsEnvMetadata;
  const targetSopsEnvMetadata = ((
    targetConfig?.metadata as Record<string, unknown>
  )?.[SOPS_ENV_METADATA_NAME] || {}) as SopsEnvMetadata;

  // Merge metadata with target taking precedence
  const sopsEnvMetadata: SopsEnvMetadata = {
    "override-sops-env-project":
      targetSopsEnvMetadata["override-sops-env-project"] ??
      projectSopsEnvMetadata["override-sops-env-project"],
    "additional-sops-env-files": [
      ...(projectSopsEnvMetadata["additional-sops-env-files"] || []),
      ...(targetSopsEnvMetadata["additional-sops-env-files"] || []),
    ],
    "additional-dotenv-files": [
      ...(projectSopsEnvMetadata["additional-dotenv-files"] || []),
      ...(targetSopsEnvMetadata["additional-dotenv-files"] || []),
    ],
  };

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

  // Determine source project (could be current project or overridden via metadata)
  let sourceProjectName = projectName;
  let sourceProjectRoot = projectRoot;

  // Check if we should use another project's env files
  if (sopsEnvMetadata["override-sops-env-project"]) {
    const overrideProjectName = sopsEnvMetadata["override-sops-env-project"];
    const overrideProject =
      context.projectsConfigurations?.projects[overrideProjectName];

    if (!overrideProject) {
      logger.error(
        `Override project '${overrideProjectName}' not found in workspace`,
      );
      return { success: false };
    }

    sourceProjectName = overrideProjectName;
    sourceProjectRoot = overrideProject.root;

    logger.verbose(
      `Using SOPS env files from project '${overrideProjectName}' (override-sops-env-project)`,
    );
  }

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
    process.env["NX_SOPS_USE_CONTRACTOR_ENV"] ? ".contractor.enc.yaml" : ".enc.yaml",
  );

  // Get plaintext .env files in priority order
  const plaintextEnvPaths = getPlaintextEnvPathsForTask(
    sourceProjectRoot,
    unprefixedTarget,
    configurationName,
  );

  if (sopsFilePaths.length === 0 && plaintextEnvPaths.length === 0) {
    logger.verbose(
      `No env files found in ${sourceProjectRoot}, skipping env loading`,
    );
    // Still run the target even if no env files
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

  // Prepare interpolation context for template variables
  const interpolationContext = {
    workspaceRoot: context.root,
    projectRoot,
  };

  // Load SOPS files in priority order (later files override earlier ones)
  const envVars: Record<string, string> = {};

  try {
    // 1. Load standard SOPS files from source project
    for (const sopsPath of sopsFilePaths) {
      logger.info(`Decrypting ${sopsPath}`);
      const decryptedYaml = decryptSopsFile(sopsPath);
      Object.assign(envVars, decryptedYaml);
    }

    let totalFilesLoaded = sopsFilePaths.length;

    // 2. Load standard plaintext .env files from source project (override encrypted)
    for (const envPath of plaintextEnvPaths) {
      logger.verbose(`Loading plaintext env file: ${envPath}`);
      const dotenvVars = loadDotenvFile(envPath);
      Object.assign(envVars, dotenvVars);
      totalFilesLoaded++;
    }

    // 3. Load additional SOPS files from metadata
    if (sopsEnvMetadata["additional-sops-env-files"]?.length) {
      for (const additionalFile of sopsEnvMetadata[
        "additional-sops-env-files"
      ]) {
        const interpolatedPath = interpolatePath(
          additionalFile,
          interpolationContext,
        );
        logger.verbose(`Decrypting additional SOPS file: ${interpolatedPath}`);
        const decryptedYaml = decryptSopsFile(interpolatedPath);
        Object.assign(envVars, decryptedYaml);
        totalFilesLoaded++;
      }
    }

    // 4. Load additional dotenv files from metadata
    if (sopsEnvMetadata["additional-dotenv-files"]?.length) {
      for (const dotenvFile of sopsEnvMetadata["additional-dotenv-files"]) {
        const interpolatedPath = interpolatePath(
          dotenvFile,
          interpolationContext,
        );
        logger.info(`Loading additional dotenv file: ${interpolatedPath}`);
        const dotenvVars = loadDotenvFile(interpolatedPath);
        Object.assign(envVars, dotenvVars);
        totalFilesLoaded++;
      }
    }

    // Load variables into process.env (child process will inherit)
    // Following Nx behavior: do not override variables that are already set
    let newVarsCount = 0;
    for (const [key, value] of Object.entries(envVars)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
        newVarsCount++;
      }
    }

    logger.info(
      `Loaded ${newVarsCount} environment variables from ${totalFilesLoaded} file(s) (${Object.keys(envVars).length - newVarsCount} already set)`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load environment files: ${message}`);
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
