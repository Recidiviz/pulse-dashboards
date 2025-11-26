// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  createNodesFromFiles,
  CreateNodesResult,
  CreateNodesV2,
} from "@nx/devkit";
import { dirname } from "path";

/**
 * Defines the custom default tasks to be registered for a given project
 */
async function createNodesInternal(
  projectFilePath: string,
): Promise<CreateNodesResult> {
  const projectRoot = dirname(projectFilePath);

  return {
    projects: {
      [projectRoot]: {
        targets: {
          projectTags: {
            executor: "~repo:projectTags",
            cache: true,
          },
        },
      },
    },
  };
}

// exporting this lets us register default tasks for projects whose contents match the provided glob
// (which in this case should be all of them)
export const createNodesV2: CreateNodesV2 = [
  "**/project.json",
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile) => createNodesInternal(configFile),
      configFiles,
      options,
      context,
    );
  },
];
