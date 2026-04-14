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
 * Verifies that all Nx projects containing story files matched by the storybook
 * config are listed in implicitDependencies in project.json.
 *
 * This is necessary because we use a single standalone Storybook project
 * for all JII libraries, using the "one Storybook per scope" pattern described
 * at https://nx.dev/docs/technologies/test-tools/storybook/guides/one-storybook-per-scope
 *
 * Run via: nx run @jii/storybook:check-implicit-dependencies
 */

import { dirname, relative, resolve } from "node:path";

import {
  readCachedProjectGraph,
  readJsonFile,
  workspaceRoot,
} from "@nx/devkit";
import fg from "fast-glob";

import storybookConfig from "../.storybook/main";

const projectRoot = resolve(__dirname, "..");
const storybookConfigDir = resolve(projectRoot, ".storybook");

// --- Get story glob patterns from .storybook/main.ts ---

const globPatterns = storybookConfig.stories.filter(
  (s) => typeof s === "string",
);

// we expect to find patterns there so something has gone wrong if this happens
if (globPatterns.length === 0) {
  console.error("No glob patterns found in .storybook/main.ts stories array");
  process.exit(1);
}

// --- Find all story files matching those patterns ---

// Patterns in main.ts are relative to .storybook/, so resolve from there.
const storyFiles = fg.sync(globPatterns, {
  cwd: storybookConfigDir,
  onlyFiles: true,
});

// --- Map each story file to its Nx project name ---
// Nx doesn't actually provide an API for this so we have to do some lookup logic

const projectGraph = readCachedProjectGraph();

// Build a lookup: workspace-relative project root → project name
const projectRootToName = Object.fromEntries(
  Object.entries(projectGraph.nodes).map(([name, node]) => [
    node.data.root,
    name,
  ]),
);

function findProjectNameForFile(
  storybookRelativeFilePath: string,
): string | null {
  const absFile = resolve(storybookConfigDir, storybookRelativeFilePath);
  const wsRelativeFile = relative(workspaceRoot, absFile);

  // Walk up from the file's directory. The first match is guaranteed to be the
  // longest (most specific) project root, since we start closest to the file.
  let dir = dirname(wsRelativeFile);
  while (true) {
    if (dir in projectRootToName) return projectRootToName[dir];
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const projectsWithStories = new Set<string>();
for (const file of storyFiles) {
  const projectName = findProjectNameForFile(file);
  if (projectName) {
    projectsWithStories.add(projectName);
  } else {
    console.warn(
      `Warning: could not determine project for story file: ${file}`,
    );
  }
}

// --- Compare with implicitDependencies ---

const storybookProjectJson = readJsonFile(resolve(projectRoot, "project.json"));
const implicitDependencies: string[] =
  storybookProjectJson.implicitDependencies ?? [];

const missing = [...projectsWithStories].filter(
  (p) => !implicitDependencies.includes(p),
);

if (missing.length > 0) {
  console.error(
    "The following projects have stories matched by the storybook config but are missing from implicitDependencies in apps/@jii/storybook/project.json:\n",
  );
  for (const dep of missing) {
    console.error(`  - ${dep}`);
  }
  console.error("\nAdd them to the implicitDependencies array to fix this.\n");
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(
  `✓ All ${projectsWithStories.size} project(s) with stories are listed in implicitDependencies.`,
);
