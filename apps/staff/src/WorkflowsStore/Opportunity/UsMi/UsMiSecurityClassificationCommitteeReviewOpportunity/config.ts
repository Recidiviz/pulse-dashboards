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
import { usMiSecurityClassificationCommitteeReviewOpportunity } from "./UsMiSecurityClassificationCommitteeReviewOpportunity";

export const usMiSecurityClassificationCommitteeReviewConfig: OpportunityConfig<usMiSecurityClassificationCommitteeReviewOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_MI",
    urlSection: "securityClassificationCommitteeReview",
    label: "Security Classification Committee Review",
    initialHeader:
      "Complete SCC review and fill out 283 Form for eligible residents.",
    dynamicEligibilityText:
      "resident[|s] [is|are] eligible for SCC review to potentially return to general population",
    callToAction:
      "Complete SCC review and fill out 283 Form for eligible residents",
    firestoreCollection: "US_MI-securityClassificationCommitteeReview",
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
        "Overdue",
        "Due now",
        "Upcoming",
        "Marked Ineligible",
      ],
    },
    sidebarComponents: ["Incarceration", "UsMiRestrictiveHousing"],
    eligibleCriteriaCopy: {
      usMiPastSecurityClassificationCommitteeReviewDate: {
        text: `{{record.metadata.daysInCollapsedSolitarySession}} consecutive days in restrictive housing;{{#if latestSccReviewDate}} last SCC review recorded on {{date latestSccReviewDate}};{{/if}} SCC review due on or before {{date nextSccDate}}`,
        tooltip: `A housing unit team review shall be conducted within seven calendar days of the prisoner being classified to administrative segregation. SCC shall review the prisoner at least every 30 calendar days thereafter until the prisoner is reclassified to general population status.`,
      },
      housingUnitTypeIsSolitaryConfinement: {
        text: `Currently in {{record.formInformation.segregationType}}`,
        tooltip: `{{#if (eq record.formInformation.segregationType "ADMINISTRATIVE_SOLITARY_CONFINEMENT")}}Housing unit team members and SCC shall regularly review the behavioral adjustment of each prisoner classified to administrative segregation, including prisoners classified to administrative segregation who are serving a detention sanction for misconduct.{{else if (eq record.formInformation.segregationType "TEMPORARY_SOLITARY_CONFINEMENT")}}If the prisoner is held in temporary segregation for more than 30 calendar days, the facility shall afford the prisoner a review to determine whether there is a continuing need for separation.{{/if}}`,
      },
    },
    ineligibleCriteriaCopy: {
      usMiPastSecurityClassificationCommitteeReviewDate: {
        text: "Next SCC review due next week, on or before {{date nextSccDate}}",
        tooltip:
          "A housing unit team review shall be conducted within seven calendar days of the prisoner being classified to administrative segregation. SCC shall review the prisoner at least every 30 calendar days thereafter until the prisoner is reclassified to general population status.",
      },
    },
  };
