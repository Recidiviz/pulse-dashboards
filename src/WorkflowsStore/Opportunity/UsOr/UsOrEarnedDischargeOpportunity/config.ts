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
import { UsOrEarnedDischargeOpportunity } from "./UsOrEarnedDischargeOpportunity";

export const usOrEarnedDischargeConfig: OpportunityConfig<UsOrEarnedDischargeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_OR",
    urlSection: "earnedDischarge",
    label: "Earned Discharge",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] on [a|] funded sentence[|s] may be `,
      opportunityText: "eligible for Earned Discharge from Supervision",
      callToAction:
        "Review clients who may be eligible for ED and complete the EDIS checklist.",
    }),
    firestoreCollection: "US_OR-earnedDischarge",
    denialButtonText: "Additional Eligibility",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 180,
    },
  };
