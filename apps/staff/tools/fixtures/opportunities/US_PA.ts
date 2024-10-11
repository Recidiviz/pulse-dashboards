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

import { ApiOpportunityConfigurationResponse } from "../../../src/WorkflowsStore/Opportunity/OpportunityConfigurations/interfaces";

export const mockApiOpportunityConfigurationResponse = {
  enabledConfigs: {
    usPaAdminSupervision: {
      callToAction: "Review clients and complete the DC-P 402 checklist",
      compareBy: null,
      denialReasons: {
        "FELONY DRUG":
          "Client is currently being supervised for an ineligible felony drug offense",
        "FINES & FEES":
          "Client is not making efforts to reduce financial obligations",
        Other: "Other, please specify a reason",
      },
      denialText: null,
      displayName: "Administrative Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for transfer to Adminstrative Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usPaFulfilledRequirements: {
          text: "Has fulfilled treatment and special condition requirements",
        },
        usPaNoHighSanctionsInPastYear: {
          text: "Has not incurred high sanctions within the last year",
        },
        usPaNotServingIneligibleOffenseForAdminSupervision: {
          text: "Not serving for an ineligible offense",
        },
      },
      firestoreCollection: "US_PA-adminSupervisionReferrals",
      hideDenialRevert: false,
      homepagePosition: 1,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1dBTArU-kQojSvqWZ_i080pDtXxZe70X6/view",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_PA",
      subheading: null,
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "adminSupervision",
    },
    usPaSpecialCircumstancesSupervision: {
      callToAction:
        "Review clients and transfer to administrative supervision caseload",
      compareBy: null,
      denialReasons: {
        CONDITIONS: "Client has not completed all special conditions",
        Other: "Other, please specify a reason",
        SATISFACTORY:
          "Client has not had a satisfactory adjustment over their term of supervision",
      },
      denialText: null,
      displayName: "Special Circumstances Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for transfer to Special Circumstances Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usPaFulfilledRequirements: {
          text: "Has fulfilled treatment and special condition requirements",
          tooltip:
            "Other reentrant categories that can be considered for the SPC include:...\n[reentrants] with a satisfactory adjustment",
        },
        usPaMeetsSpecialCircumstancesCriteriaForSanctions: {
          text: "No {{sanctionType}} level sanctions within the past year.",
          tooltip:
            "Other reentrant categories that can be considered for the SPC include: \n(a) [reentrants] with a satisfactory adjustment\n(b) special probation and special parole cases that have completed all court-ordered special conditions or have no court-ordered special conditions and have had one year or more of successful supervision with no medium or high level sanctions.",
        },
        usPaMeetsSpecialCircumstancesCriteriaForTimeServed: {
          text: "Currently serving a {{caseType}} and has served on supervision for {{yearsRequiredToServe}} years",
          tooltip:
            "Other reentrant categories that can be considered for the SPC include:\n(a) those serving a life sentence...over a seven year period\n(b) a non-life sentenced reentrant (violent case)...over a five-year period\n(c) a non-life sentenced reentrant (non-violent case)...over a three-year period\n(d) special probation and special parole cases that have had one year or more of successful supervision",
        },
        usPaNotEligibleOrMarkedIneligibleForAdminSupervision: {
          text: "Not eligible for administrative supervision",
        },
      },
      firestoreCollection: "US_PA-specialCircumstancesSupervisionReferrals",
      hideDenialRevert: false,
      homepagePosition: 2,
      ineligibleCriteriaCopy: {
        usPaMeetsSpecialCircumstancesCriteriaForTimeServed: {
          text: "Needs {{daysUntil eligibleDate}} more months on supervision",
        },
      },
      initialHeader: null,
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1dBTArU-kQojSvqWZ_i080pDtXxZe70X6/view",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_PA",
      subheading: null,
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "specialCircumstancesSupervisionReferrals",
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
