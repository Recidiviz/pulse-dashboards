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
import { UsTnCustodyLevelDowngradeOpportunity } from "./UsTnCustodyLevelDowngradeOpportunity";

export const usTnCustodyLevelDowngradeConfig: OpportunityConfig<UsTnCustodyLevelDowngradeOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_TN",
    urlSection: "custodyLevelDowngrade",
    label: "Custody Level Downgrade",
    dynamicEligibilityText:
      "resident[|s] may be eligible for a custody level downgrade",
    callToAction: "Review and update custody levels.",
    subheading:
      "This alert helps staff identify residents who may be at a higher custody level than recommended and directs staff to complete & submit new classification paperwork based on the resident's latest CAF score.",
    firestoreCollection: "US_TN-custodyLevelDowngradeReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    sidebarComponents: [
      "Incarceration",
      "CaseNotes",
      "UsTnCommonlyUsedOverrideCodes",
    ],
    denialReasons: {
      Other: "Please specify a reason",
    },
    methodologyUrl: "",
    eligibleCriteriaCopy: {
      custodyLevelHigherThanRecommended: {
        text: "Custody level is higher than latest CAF score suggests",
      },
      custodyLevelIsNotMax: { text: "Custody level is not maximum" },
      usTnIneligibleForAnnualReclassification: {
        text: "Not eligible for annual reclassification",
      },
      usTnLatestCafAssessmentNotOverride: {
        text: "Last assessment did not include an override",
      },
    },
    homepagePosition: 2,
  };
