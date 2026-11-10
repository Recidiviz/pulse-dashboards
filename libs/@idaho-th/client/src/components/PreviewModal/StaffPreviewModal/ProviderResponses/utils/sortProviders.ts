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

import type { ProviderHousingApplication } from "~@idaho-th/client/interfaces/common";
import { APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

const ACTION_NEEDED_SUB_STAGES = new Set<string>([
  APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
  APPLICATION_SUB_STAGE.INFO_NEEDED,
]);

function getSortRank(
  provider: ProviderHousingApplication,
  homePlanProviderId: string | null | undefined,
): number {
  if (homePlanProviderId && provider.providerId === homePlanProviderId)
    return 0;
  if (provider.subStage && ACTION_NEEDED_SUB_STAGES.has(provider.subStage))
    return 1;
  if (provider.isPreferred) return 2;
  return 3;
}

/**
 * Sorts provider applications for display, preserving backend order within each group:
 *   1. Home plan provider (if set)
 *   2. CONDITIONALLY_APPROVED or INFO_NEEDED sub-stage
 *   3. Preferred providers
 *   4. All others
 */
export function sortProviderApplications(
  providers: ProviderHousingApplication[],
  homePlanProviderId: string | null | undefined,
): ProviderHousingApplication[] {
  return [...providers].sort(
    (a, b) =>
      getSortRank(a, homePlanProviderId) - getSortRank(b, homePlanProviderId),
  );
}
