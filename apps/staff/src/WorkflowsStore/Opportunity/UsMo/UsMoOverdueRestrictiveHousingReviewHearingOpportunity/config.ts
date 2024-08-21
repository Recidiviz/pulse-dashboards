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

import { OpportunityConfig } from "../../OpportunityConfigs";
import { baseUsMoOverdueRestrictiveHousingConfig } from "../UsMoOverdueRestrictiveHousingOpportunityBase/config";
import { UsMoOverdueRestrictiveHousingReviewHearingOpportunity } from "./UsMoOverdueRestrictiveHousingReviewHearingOpportunity";

export const usMoOverdueRestrictiveHousingReviewHearingConfig: OpportunityConfig<UsMoOverdueRestrictiveHousingReviewHearingOpportunity> =
  baseUsMoOverdueRestrictiveHousingConfig(
    "ReviewHearing",
    "in Extended Restrictive Housing to review for their next hearing",
    "Review residents and prepare necessary paperwork for their next hearing",
    "This alert helps staff identify residents in Extended Restrictive Housing  who are overdue or due for a hearing. Review residents and prepare necessary paperwork for their next hearing.",
    {
      BEDS: "Released early due to a need for Extended Restrictive Housing beds",
      SPACE: "Completed time but pending bed space",
      RELEASED: "Released this week",
      OUTDATED: "Hearing occurred this week",
      Other: "Other",
    },
    4,
  );
