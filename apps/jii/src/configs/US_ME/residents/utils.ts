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

import { IncarcerationOpportunityId, ResidentsConfig } from "../../types";

function opportunityIdsByUrlSlug(
  residentsConfig: ResidentsConfig,
): Map<string, IncarcerationOpportunityId> {
  return new Map(
    Object.entries(residentsConfig.incarcerationOpportunities).map(
      ([id, config]) => {
        return [
          config.urlSlug,
          id as keyof typeof residentsConfig.incarcerationOpportunities,
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
  residentsConfig: ResidentsConfig,
) {
  const idMapping = opportunityIdsByUrlSlug(residentsConfig);

  const id = idMapping.get(slug);
  if (!id) {
    throw new Error(`No opportunity ID matches url segment ${slug}`);
  }
  return id;
}
