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

import { z } from "zod";

import { OpportunityConfig, RequirementCopy } from "../../configs/types";

/**
 * `icon` property should correspond to design system Icon name
 */
export type RequirementsSectionContent = {
  label: string;
  icon: string;
  requirements: Array<RequirementCopy>;
};

export const eligibilityStatusEnum = z.enum([
  "ELIGIBLE",
  "ALMOST_ELIGIBLE",
  "INELIGIBLE",
]);

export type EligibilityStatus = z.infer<typeof eligibilityStatusEnum>;

export interface EligibilityReport {
  name: string;
  description: string;
  status: {
    value: EligibilityStatus;
    label: string;
  };
  requirements: Array<RequirementsSectionContent>;
  enabledSections: OpportunityConfig["sections"];
  highlights: Array<{ label: string; value: string }>;
}
