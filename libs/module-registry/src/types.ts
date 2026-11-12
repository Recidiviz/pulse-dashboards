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

// TODO: hoist FV types out of staff app
type FeatureVariant = string;
// TODO: hoist TenantIds out of staff app
export type TenantId = "RECIDIVIZ" | "US_CO" | "US_MI" | "US_TN";

export type ModuleRegistryRecord = {
  moduleName: string;
  description: string;
  enabledTenants: TenantId[];
  // If set, only users with this FV enabled can access this tenant
  gatingFeatureVariant?: FeatureVariant;
  // Only FVs listed here are passed on to the module
  featureVariants: FeatureVariant[];
};

export type ModuleNames<Registry extends ModuleRegistryRecord[]> =
  Registry extends [
    infer Record extends ModuleRegistryRecord,
    ...infer Rest extends ModuleRegistryRecord[],
  ]
    ? Record["moduleName"] | ModuleNames<Rest>
    : never;
