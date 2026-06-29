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

import { argv, exit, stdout } from "node:process";
import { pathToFileURL } from "node:url";

import { createProjectGraphAsync } from "@nx/devkit";

/**
 * Resolves the Artifact Registry path (no tag) for an Nx project's `container`
 * target, preferring the `staging` configuration and falling back to `demo`.
 * Single source of truth shared between `.github/workflows/build-images.yml`
 * and `tools/deploy.mts`.
 */
export async function getImageRef(projectName: string): Promise<string> {
  const graph = await createProjectGraphAsync({ exitOnError: false });
  const node = graph.nodes[projectName];
  if (!node) {
    throw new Error(`Unknown Nx project: ${projectName}`);
  }
  const configs = node.data.targets?.["container"]?.configurations ?? {};
  const tag: string | undefined =
    configs["staging"]?.tags?.[0] ?? configs["demo"]?.tags?.[0];
  if (!tag) {
    throw new Error(`No staging/demo container tag found for ${projectName}`);
  }
  return tag.slice(0, tag.lastIndexOf(":"));
}

// CLI entry point: `tsx tools/get-image-ref.mts <nx-project>`
// createProjectGraphAsync may spawn the Nx daemon, which keeps an open socket
// and prevents Node from exiting on its own — call exit() explicitly.
if (import.meta.url === pathToFileURL(argv[1]).href) {
  const project = argv[2];
  if (!project) {
    console.error("Usage: get-image-ref.mts <nx-project>");
    exit(1);
  }
  stdout.write(`${await getImageRef(project)}\n`);
  exit(0);
}
