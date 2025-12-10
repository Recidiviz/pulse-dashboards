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
import { CreateNodesContextV2 } from "nx/src/project-graph/plugins/public-api";
import { dirname, join } from "path";

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
    logger.error(e);
    // Ignore errors reading project.json
    return {};
  }

  if (!projectJson || !projectJson.targets) {
    return {};
  }

  const targets: Record<string, TargetConfiguration> = {};

  // Find targets with 'requires-sops-env:' prefix
  for (const [targetName, targetConfig] of Object.entries(
    projectJson.targets,
  )) {
    if (targetName.startsWith("requires-sops-env:")) {
      // Extract the unprefixed name
      const unprefixedName = targetName.replace("requires-sops-env:", "");

      // Type assertion for targetConfig
      const config = targetConfig as TargetConfiguration;

      // Forward configurations for the inferred task so that NX_TASK_TARGET_CONFIGURATION is set
      const configurations = Object.fromEntries(
        Object.keys(config.configurations || {}).map((name) => [name, {}]),
      );

      // Create a new target that delegates to the prefixed target
      targets[unprefixedName] = {
        executor: "~repo:sopsDelegateExecutor",
        options: {
          prefixedTarget: targetName,
        },
        configurations,
      };

      logger.verbose(
        `SOPS-ENV: Created delegate target '${unprefixedName}' -> '${targetName}' in ${projectRoot}`,
      );
    }
  }

  return targets;
};
