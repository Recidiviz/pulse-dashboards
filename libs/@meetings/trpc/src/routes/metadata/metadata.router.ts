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

import { baseProcedure, router } from "~@meetings/trpc/init";
import { checkAppVersionInputSchema } from "~@meetings/trpc/routes/metadata/metadata.schema";

const MINIMUM_APP_VERSION = "0.10.12";

const UNRELEASED_APP_VERSION = "0.0.0";

function parseVersion(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? match.slice(1).map(Number) : null;
}

export function requiresUpgrade(appVersion: string) {
  const current = parseVersion(appVersion);
  const minimum = parseVersion(MINIMUM_APP_VERSION);
  if (!current || !minimum || appVersion === UNRELEASED_APP_VERSION) {
    return false;
  }

  const differing = current.findIndex((part, i) => part !== minimum[i]);
  return differing !== -1 && current[differing] < minimum[differing];
}

export const metadataRouter = router({
  checkAppVersion: baseProcedure
    .input(checkAppVersionInputSchema)
    .query(async ({ input }) => {
      return { requiresUpgrade: requiresUpgrade(input.appVersion) };
    }),
});
