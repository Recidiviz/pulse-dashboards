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
import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { generateTabs } from "../../utils/tabUtils";
import { UsMoRestrictiveHousingStatusHearingOpportunity } from "./UsMoRestrictiveHousingStatusHearingOpportunity";

export const usMoRestrictiveHousingStatusHearingConfig: OpportunityConfig<UsMoRestrictiveHousingStatusHearingOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_MO",
    urlSection: "restrictiveHousingStatusHearing",
    inverseFeatureVariant: "usMoOverdueRHPilot",
    label: "Restrictive Housing Status Hearing",
    snooze: {
      autoSnoozeParams: {
        type: "snoozeUntil",
        params: {
          weekday: "Monday",
        },
      },
    },
    dynamicEligibilityText:
      "resident[|s] [is|are] currently in Restrictive Housing",
    callToAction: "Conduct a Restrictive Housing Status Hearing",
    firestoreCollection: "US_MO-restrictiveHousingStatusHearingReferrals",
    tabOrder: generateTabs({
      isAlert: true,
      customTabOrder: [
        "Overdue For Hearing",
        "Missing Review Date",
        "Upcoming Hearings",
        "Overridden",
      ],
    }),
    sidebarComponents: ["UsMoIncarceration", "UsMoRestrictiveHousing"],
    isAlert: true,
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MO,
    denialReasons: {
      COMP: "Hearing Completed",
      Other: "Other, please specify a reason",
    },
    compareBy: [
      {
        field: "eligibilityDate",
        sortDirection: "asc",
        undefinedBehavior: "undefinedFirst",
      },
    ],
  };
