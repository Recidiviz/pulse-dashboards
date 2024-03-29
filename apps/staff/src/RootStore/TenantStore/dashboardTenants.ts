// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { PATHWAYS_TENANTS } from "./pathwaysTenants";

export const US_CA = "US_CA";
export const US_OR = "US_OR";
export const US_PA = "US_PA";

export const WORKFLOWS_ONLY_TENANTS = [US_CA, US_OR, US_PA] as const;

/**
 * Tenants that have access to the Recidiviz Dashboard, including Pathways, Operations, and Workflows.
 */
export const DASHBOARD_TENANTS = [
  ...WORKFLOWS_ONLY_TENANTS,
  ...PATHWAYS_TENANTS,
];
