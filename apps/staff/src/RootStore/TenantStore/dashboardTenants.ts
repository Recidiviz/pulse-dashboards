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

import { PATHWAYS_TENANTS } from "./pathwaysTenants";

export const US_AR = "US_AR";
export const US_CA = "US_CA";
export const US_ME = "US_ME";
export const US_MI = "US_MI";
export const US_OR = "US_OR";
export const US_PA = "US_PA";

const NON_PATHWAYS_TENANTS = [
  US_AR,
  US_CA,
  US_ME,
  US_MI,
  US_OR,
  US_PA,
] as const;

/**
 * Tenants that have access to the Recidiviz Dashboard, including Pathways, Operations, and Workflows.
 */
export const DASHBOARD_TENANTS = [...NON_PATHWAYS_TENANTS, ...PATHWAYS_TENANTS];
