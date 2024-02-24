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
import simplur from "simplur";

import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsMeEarlyTerminationOpportunity } from "./UsMeEarlyTerminationOpportunity";

export const usMeEarlyTerminationConfig: OpportunityConfig<UsMeEarlyTerminationOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_ME",
    urlSection: "earlyTermination",
    label: "Early Termination",
    initialHeader:
      "Search for officers above to review clients who may be good candidates for early termination from probation.",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be [a|] good candidate[|s] for `,
      opportunityText: "Early Termination",
      callToAction:
        "Search for officers above to review clients who may be good candidates for early termination from probation.",
    }),
    firestoreCollection: "US_ME-earlyTerminationReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 180,
    },
  };
