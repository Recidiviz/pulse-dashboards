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

import { PromiseExecutor } from "@nx/devkit";

// eslint-disable-next-line @nx/enforce-module-boundaries
import { TYPE_TAGS } from "../../../../eslint.config.mjs";

const runExecutor: PromiseExecutor = async (options, context) => {
  const { projectName, projectsConfigurations } = context;

  // shouldn't happen in practice
  if (!projectName) {
    console.error("Unknown project name");
    return { success: false };
  }

  // for now the rules only apply to JII libs!
  if (!projectName.startsWith("@jii/")) return { success: true };

  const projectConfig = projectsConfigurations.projects[projectName];

  // state projects are special so let's make sure they are set up correctly

  // these are all things that should be true of state projects, and not true of other projects
  const hasStateTag = !!projectConfig.tags?.includes(TYPE_TAGS.state);
  const hasStateProjectName = /\/US_[a-zA-Z]{2}$/.test(projectName);
  const isStateUppercase = /\/US_[A-Z]{2}$/.test(projectName);
  const isInStatesFolder = /^libs\/@jii\/states\/US_[A-Z]{2}$/.test(
    projectConfig.root,
  );

  const stateProjectChecks = [
    hasStateTag,
    hasStateProjectName,
    isStateUppercase,
    isInStatesFolder,
  ];

  if (
    stateProjectChecks.every((v) => v) ||
    stateProjectChecks.every((v) => !v)
  ) {
    return { success: true };
  } else {
    if (!hasStateTag) {
      console.error(
        "State-specific feature library must be tagged with type:state",
      );
    }
    if (!hasStateProjectName || !isStateUppercase) {
      console.error(
        "State-specific feature library should follow naming convention '@jii/US_XX'",
      );
    }
    if (!isInStatesFolder) {
      console.error(
        "State-specific feature library should follow directory convention 'libs/@jii/states/US_XX'",
      );
    }
    return { success: false };
  }
};

export default runExecutor;
