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

import { isEqual } from "lodash";

import { EligibilityModuleConfig } from "../../configs/types";
import { IdTuple } from "./types";

/**
 * Tries to match provided IDs to a comparison config object.
 * Order of the IDs does not matter
 */
export function findMatchingComparisonConfig(
  eligibilityConfig: EligibilityModuleConfig,
  opportunityIds: IdTuple,
) {
  return eligibilityConfig.comparisons?.find((config) =>
    isEqual([...config.opportunities].sort(), [...opportunityIds].sort()),
  );
}
