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
import { UsTnAnnualReclassificationReviewOpportunity } from "./UsTnAnnualReclassificationReviewOpportunity";

export const UsTnAnnualReclassificationReviewConfig: OpportunityConfig<UsTnAnnualReclassificationReviewOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_TN",
    urlSection: "annualReclassification",
    label: "Annual Reclassification",
    featureVariant: "usTnAnnualReclassification",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} resident[|s] [is|are] eligible `,
      opportunityText: "for their annual reclassification",
      callToAction:
        "Review residents due for their annual reclassification " +
        "and update their custody level in TOMIS.",
    }),
    firestoreCollection: "US_TN-annualReclassificationReferrals",
    snooze: {
      maxSnoozeDays: 90,
      defaultSnoozeDays: 30,
    },
  };
