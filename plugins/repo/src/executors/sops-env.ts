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

import { logger, ProjectConfiguration, TargetConfiguration } from "@nx/devkit";
import { existsSync, readFileSync } from "fs";
import merge from "lodash/merge";
import { CreateNodesContextV2 } from "nx/src/project-graph/plugins/public-api";
import { dirname, join } from "path";

export const SOPS_ENV_PREFIX = "requires-sops-env:";

/**
 * Read and parse nx.json from the workspace root
 */
function readNxJson(workspaceRoot: string): {
  targetDefaults?: Record<string, TargetConfiguration>;
} | null {
  try {
    const nxJsonPath = join(workspaceRoot, "nx.json");
    if (existsSync(nxJsonPath)) {
      return JSON.parse(readFileSync(nxJsonPath, "utf-8"));
    }
  } catch (e) {
    logger.error(`Failed to parse nx.json: ${e}`);
  }
  return null;
}

// Detect targets with 'requires-sops-env:' prefix and return un-prefixed inferred delegate targets
export const createUnwrappedSopsEnvTargets = (
  projectFile: string,
  context: CreateNodesContextV2,
): Record<string, TargetConfiguration> => {
  const projectRoot = dirname(projectFile);
  let projectJson: ProjectConfiguration | null = null;

  try {
    const projectJsonPath = join(context.workspaceRoot, projectFile);
    if (existsSync(projectJsonPath)) {
      projectJson = JSON.parse(readFileSync(projectJsonPath, "utf-8"));
    }
  } catch (e) {
    logger.error(`Failed to parse project.json at path ${projectFile}: ${e}`);
    // Ignore errors reading project.json
    return {};
  }

  if (!projectJson || !projectJson.targets) {
    return {};
  }

  // Read nx.json to get targetDefaults
  const nxJson = readNxJson(context.workspaceRoot);
  const targetDefaults = nxJson?.targetDefaults || {};

  const targets: Record<string, TargetConfiguration> = {};

  // Find targets with 'requires-sops-env:' prefix
  for (const [targetName, targetConfig] of Object.entries(
    projectJson.targets,
  )) {
    if (targetName.startsWith(SOPS_ENV_PREFIX)) {
      // Extract the unprefixed name
      const unprefixedName = targetName.replace(SOPS_ENV_PREFIX, "");

      // Type assertion for targetConfig
      const projectTargetConfig = targetConfig as TargetConfiguration;

      // Merge nx.json targetDefaults (base) with project.json config (override)
      const prefixedDefaults = targetDefaults[targetName];
      const mergedPrefixedTarget = prefixedDefaults
        ? merge({}, prefixedDefaults, projectTargetConfig)
        : projectTargetConfig;

      // Forward configurations from merged target for the inferred task so that NX_TASK_TARGET_CONFIGURATION is set
      const configurations = Object.fromEntries(
        Object.keys(mergedPrefixedTarget.configurations || {}).map((name) => [
          name,
          {},
        ]),
      );

      // Create a new target that loads env then delegates to the prefixed target
      targets[unprefixedName] = {
        executor: "~repo:sopsDelegateExecutor",
        options: {
          prefixedTarget: targetName,
        },
        configurations,
      };

      // Also create the prefixed target with merged configuration
      targets[targetName] = mergedPrefixedTarget;

      logger.verbose(
        `SOPS-ENV: Created delegate target '${unprefixedName}' -> '${targetName}' in ${projectRoot}`,
      );

      if (prefixedDefaults) {
        logger.verbose(
          `SOPS-ENV: Merged targetDefaults for '${targetName}' in ${projectRoot}`,
        );
      }
    }
  }

  return targets;
};
