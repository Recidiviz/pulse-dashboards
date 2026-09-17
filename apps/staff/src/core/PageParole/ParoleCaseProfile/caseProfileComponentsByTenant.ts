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

import { ComponentType } from "react";

import { ParoleCase } from "~datatypes";

import { TenantId } from "../../../RootStore/types";
import type { ParoleConfig } from "../../models/types";
import { UsCoParoleCaseProfile } from "../UsCo/UsCoParoleCaseProfile";
import { UsIdParoleCaseProfile } from "../UsId/UsIdParoleCaseProfile";

export type ParoleCaseProfileComponent = ComponentType<{
  caseDetail: ParoleCase;
  config: ParoleConfig;
}>;

/**
 * Each state's own Parole case profile page. Every state with Parole enabled
 * needs an entry.
 *
 * This mapping lives beside the page rather than in the tenant config on
 * purpose: a tenant config that imported a page component would pull in
 * NavigationLayout and close a module-load cycle (see SectionAnchor).
 */
export const CASE_PROFILE_COMPONENTS_BY_TENANT: Partial<
  Record<TenantId, ParoleCaseProfileComponent>
> = {
  US_CO: UsCoParoleCaseProfile,
  US_ID: UsIdParoleCaseProfile,
};
