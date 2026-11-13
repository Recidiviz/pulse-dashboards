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

import { CommunityReentryPlanInput } from "~datatypes";

import {
  ResolvedSection,
  resolveSection,
  SectionConfig,
} from "./resolveSection";

// The Community Reentry Plan has no rows.
type NoRowFields = Record<never, never>;

export type CommunityReentryPlanFields = {
  housing: string;
  employment: string;
  aftercare: string;
  transportation: string;
  supportNetwork: string;
};

export type ResolvedCommunityReentryPlan = ResolvedSection<
  CommunityReentryPlanFields,
  NoRowFields
>;

// Atlas has nothing for the Community Reentry Plan, so no field reads from it.
const communityReentryPlanConfig: SectionConfig<
  undefined,
  never,
  CommunityReentryPlanFields,
  NoRowFields
> = {
  fields: {
    housing: {},
    employment: {},
    aftercare: {},
    transportation: {},
    supportNetwork: {},
  },
};

/**
 * Returns the Community Reentry Plan the report shows: the PHI's text for
 * each part of the plan, null until the PHI writes it.
 *
 * For example, if the PHI wrote about housing and emptied the support network
 * box (editors and times abridged):
 *
 *   input:    housing "Plans to live with a sibling...", supportNetwork null
 *   resolves: housing        "Plans to live with a sibling..."  source PHI
 *             supportNetwork null                               source PHI
 *             employment     null                               source ATLAS
 *             (aftercare and transportation the same as employment)
 *
 * @param input - The report's Community Reentry Plan input, or undefined if
 *   the PHI has entered nothing in the section.
 */
export function resolveCommunityReentryPlan(
  input: CommunityReentryPlanInput | undefined,
): ResolvedCommunityReentryPlan {
  return resolveSection(communityReentryPlanConfig, undefined, input);
}
