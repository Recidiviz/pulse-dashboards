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

import { AttributeKey } from "../components/Dashboard/types";

/**
 * Helper function for filtering out attributes based on state-specific attribute key exclusions
 * e.g. in ND filtering out the Report Type column from the Dashboard and field in the case attributes header
 */
export const filterExcludedAttributes =
  (excludedAttributeKeys?: AttributeKey[], keyProperty = "key") =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T extends { [key: string]: any }>(item: T): boolean => {
    if (!excludedAttributeKeys) return true;

    const excludedKeys = excludedAttributeKeys || [];

    return !excludedKeys.includes(item[keyProperty]);
  };
