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

import { TRPCRouterRecord } from "@trpc/server";
import { clone } from "lodash-es";

import { manifest as userSettingsManifest } from "~@modules/UserSettings/router";
import { manifest as usTnReclassificationManifest } from "~@modules/UsTnReclassification/router";
import { ModuleBackendManifest } from "~@modules-server/trpc-base";

export const MANIFEST_REGISTRY = [
  userSettingsManifest,
  usTnReclassificationManifest,
] satisfies ModuleBackendManifest[];

export function registerManifests(
  baseProcedures: TRPCRouterRecord,
  manifests: ModuleBackendManifest[],
): TRPCRouterRecord {
  const procedures: TRPCRouterRecord = clone(baseProcedures);

  for (const { module, router } of manifests) {
    if (procedures[module]) {
      throw new Error(
        `Attempting to mount procedures under existing key: ${module}`,
      );
    }
    procedures[module] = router;
  }

  return procedures;
}
