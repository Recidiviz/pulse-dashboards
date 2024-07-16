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
import { OpportunityConfig } from "../../OpportunityConfigs";
import { baseUsMoOverdueRestrictiveHousingConfig } from "../UsMoOverdueRestrictiveHousingOpportunityBase/config";
import { UsMoOverdueRestrictiveHousingInitialHearingOpportunity } from "./UsMoOverdueRestrictiveHousingInitialHearingOpportunity";

export const usMoOverdueRestrictiveHousingInitialHearingConfig: OpportunityConfig<UsMoOverdueRestrictiveHousingInitialHearingOpportunity> =
  baseUsMoOverdueRestrictiveHousingConfig(
    "InitialHearing",
    "on Temporary Assignment to review for their initial meaningful hearing",
    "Review residents and prepare necessary paperwork for their hearing.",
    "This alert helps staff identify residents in Temporary Assignment who are overdue or due for an initial meaningful hearing.",
    {
      BEDS: "Released early due to a need for Restrictive Housing beds",
      SPACE: "Completed time but pending bed space",
      RELEASED: "Released this week",
      OUTDATED: "Hearing occurred this week",
      EXTENDED:
        "Received a new minor rule violation, resulting in an extension to their Restrictive Housing placement",
      REFERRED:
        "Received a new major rule violation, resulting in a referral to Extended Restrictive Housing Review Committee",
      Other: "Other",
    },
  );
