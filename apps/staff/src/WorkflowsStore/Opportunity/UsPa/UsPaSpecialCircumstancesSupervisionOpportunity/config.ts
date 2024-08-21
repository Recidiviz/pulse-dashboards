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
import { UsPaSpecialCircumstancesSupervisionOpportunity } from "./UsPaSpecialCircumstancesSupervisionOpportunity";

export const usPaSpecialCircumstancesSupervisionConfig: OpportunityConfig<UsPaSpecialCircumstancesSupervisionOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_PA",
    urlSection: "specialCircumstancesSupervision",
    label: "Special Circumstances Supervision",
    dynamicEligibilityText:
      "client[|s] may be eligible for transfer to Special Circumstances Supervision",
    callToAction:
      "Review clients and transfer to administrative supervision caseload",
    firestoreCollection: "US_PA-specialCircumstancesSupervision",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
    featureVariant: "usPaSpecialCircumstances",
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_PA,
    denialReasons: {
      SATISFACTORY:
        "Client has not had a satisfactory adjustment over their term of supervision",
      CONDITIONS: "Client has not completed all special conditions",
      Other: "Other, please specify a reason",
    },
    eligibleCriteriaCopy: {
      usPaMeetsSpecialCircumstancesCriteriaForTimeServed: {
        text: "Currently serving a {{caseType}} and has served on supervision for {{yearsRequiredToServe}} years",
        tooltip:
          "Other reentrant categories that can be considered for the SPC include:\n(a) those serving a life sentence...over a seven year period\n(b) a non-life sentenced reentrant (violent case)...over a five-year period\n(c) a non-life sentenced reentrant (non-violent case)...over a three-year period\n(d) special probation and special parole cases that have had one year or more of successful supervision",
      },
      usPaMeetsSpecialCircumstancesCriteriaForSanctions: {
        text: "No {{sanctionType}} level sanctions within the past year.",
        tooltip:
          "Other reentrant categories that can be considered for the SPC include: \n(a) [reentrants] with a satisfactory adjustment\n(b) special probation and special parole cases that have completed all court-ordered special conditions or have no court-ordered special conditions and have had one year or more of successful supervision with no medium or high level sanctions.",
      },
      usPaFulfilledRequirements: {
        text: "Has fulfilled treatment and special condition requirements",
        tooltip:
          "Other reentrant categories that can be considered for the SPC include:...\n[reentrants] with a satisfactory adjustment",
      },
      usPaNotEligibleOrMarkedIneligibleForAdminSupervision: {
        text: "Not eligible for administrative supervision",
      },
    },
    ineligibleCriteriaCopy: {
      usPaMeetsSpecialCircumstancesCriteriaForTimeServed: {
        text: "Needs {{daysUntil eligibleDate}} more months on supervision",
      },
    },
    homepagePosition: 2,
  };
