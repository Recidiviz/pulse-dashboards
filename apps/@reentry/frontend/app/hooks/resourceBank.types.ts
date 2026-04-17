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

export type ResourceOrigin = "GOOGLE" | "CRAWLER" | "CURATED" | "PARTNER";

export type ResourceWithMeta = components["schemas"]["Resource"] & {
  origin: ResourceOrigin;
  travel_distance_miles?: number;
};

export type ResourceSection = {
  title: string;
  resources: ResourceWithMeta[];
};

// Extends PlanResponseGet with the resources_by_sections field that will be
// returned by the real GET /plans/{id}/resources-by-section endpoint in Phase 2.
export type ResourceBankResponse = {
  resources_by_sections: ResourceSection[];
};
