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

import type { components } from "~@reentry/openapi-types";

type ResourceAssociationType = components["schemas"]["ResourceAssociationType"];
type Resource = components["schemas"]["Resource"];

// When non-partner digital resources are included, update to prioritize partners.
// https://linear.app/recidiviz/issue/OBT-18107/update-display-logic-to-differentiate-partners-in-fe
const RESOURCE_TYPE_ORDER: Record<ResourceAssociationType, number> = {
  DIGITAL: 0,
  COMMUNITY: 1,
};

export function sortResourcesDigitalFirst(resources: Resource[]): Resource[] {
  return [...resources].sort(
    (a, b) =>
      RESOURCE_TYPE_ORDER[a.resource_type] -
      RESOURCE_TYPE_ORDER[b.resource_type],
  );
}
