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

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity } from "./UsMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity";

export const usMiWardenInPersonSecurityClassificationCommitteeReviewConfig: OpportunityConfig<usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_MI",
    urlSection: "wardenInPersonSecurityClassificationCommitteeReview",
    label: "Warden In-Person Review",
    dynamicEligibilityText:
      "resident[|s] [is|are] eligible for in-person review by the Warden at SCC to potentially return to general population",
    callToAction:
      "Complete SCC review and fill out 283 Form for eligible residents, inclusive of Warden signature.",
    firestoreCollection:
      "US_MI-wardenInPersonSecurityClassificationCommitteeReview",
    denialReasons: {
      "PRIOR RH":
        "Prior restrictive housing history requires management at more restrictive level",
      "PLACING BEHAVIOR":
        "Severe placing behavior necessitates longer stay in segregation",
      RESPECT: "Fails to be cordial and respectful to staff",
      ATTITUDE:
        "Behavior and attitude not consistent with general population expectations",
      MISCONDUCTS: "Misconduct(s) filed during segregation",
      "GP NOT APPROPRIATE":
        "Unable to honor trust implicit in less restrictive environment ",
      Other: "Other, please specify a reason",
    },
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
    tabOrder: {
      "ELIGIBILITY STATUS": [
        "Upcoming",
        "Due now",
        "Overdue",
        "Marked Ineligible",
      ],
    },
    sidebarComponents: ["Incarceration"],
    eligibleCriteriaCopy: {
      usMiPastWardenInPersonReviewForSccDate: {
        text: `{{record.metadata.daysInCollapsedSolitarySession}} consecutive days in restrictive housing;{{#if latestWardenInPersonSccReviewDate}} last Warden in-person review recorded on {{date latestWardenInPersonSccReviewDate}};{{/if}} Warden in-person review due on or before {{date nextSccDate}}`,
        tooltip: `Wardens shall personally interview each prisoner in their respective facilities who has been confined in administrative segregation for six continuous months. If the prisoner continues in administrative segregation beyond the first six month period, the Warden shall interview the prisoner every six months thereafter until the prisoner is released from administrative segregation.`,
      },
      usMiInSolitaryConfinementAtLeastSixMonths: {
        text: `Currently in {{record.formInformation.segregationType}}`,
        tooltip: `{{#if (eq record.formInformation.segregationType "ADMINISTRATIVE_SOLITARY_CONFINEMENT")}}Housing unit team members and SCC shall regularly review the behavioral adjustment of each prisoner classified to administrative segregation, including prisoners classified to administrative segregation who are serving a detention sanction for misconduct.{{else if (eq record.formInformation.segregationType "TEMPORARY_SOLITARY_CONFINEMENT")}}If the prisoner is held in temporary segregation for more than 30 calendar days, the facility shall afford the prisoner a review to determine whether there is a continuing need for separation.{{/if}}`,
      },
    },
    ineligibleCriteriaCopy: {
      usMiPastWardenInPersonReviewForSccDate: {
        text: "Next Warden in-person review due next month, on or before {{date nextSccDate}}",
        tooltip:
          "Wardens shall personally interview each prisoner in their respective facilities who has been confined in administrative segregation for six continuous months. If the prisoner continues in administrative segregation beyond the first six month period, the Warden shall interview the prisoner every six months thereafter until the prisoner is released from administrative segregation.",
      },
    },
  };
