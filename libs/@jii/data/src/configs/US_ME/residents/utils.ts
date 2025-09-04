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

import {
  EligibilityModuleConfig,
  IncarcerationOpportunityId,
} from "../../types";

function opportunityIdsByUrlSlug(
  eligibilityConfig: EligibilityModuleConfig,
): Map<string, IncarcerationOpportunityId> {
  return new Map(
    Object.entries(eligibilityConfig.incarcerationOpportunities).map(
      ([id, opportunityConfig]) => {
        return [
          opportunityConfig.urlSlug,
          id as keyof typeof eligibilityConfig.incarcerationOpportunities,
        ];
      },
    ),
  );
}

/**
 * Get a convenient non-nullable ID value; accepts any string,
 * so you should be confident you have a valid slug or be prepared to handle an error.
 */
export function opportunitySlugToIdOrThrow(
  slug: string,
  eligibilityConfig: EligibilityModuleConfig,
) {
  const idMapping = opportunityIdsByUrlSlug(eligibilityConfig);

  const id = idMapping.get(slug);
  if (!id) {
    throw new Error(`No opportunity ID matches url segment ${slug}`);
  }
  return id;
}
