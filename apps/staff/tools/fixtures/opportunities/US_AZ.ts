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
    usAzReleaseToTPR: {
      stateCode: "US_AZ",
      displayName: "Standard Transition Program Release",
      dynamicEligibilityText:
        "inmate[|s] may be eligible for Standard Transition Program Release",
      eligibilityDateText: null,
      hideDenialRevert: false,
      tooltipEligibilityText: null,
      callToAction:
        "Review inmates who may be eligible for Standard Transition Program Release",
      subheading: null,
      snooze: { defaultSnoozeDays: 20, maxSnoozeDays: 45 },
      denialReasons: {
        COMPLIANCE: "Not compliant with corrections plan programming",
        "HOME PLAN": "Home plan incomplete",
        REFUSES: "Inmate refuses",
        Other: "Other, please specify reason",
      },
      denialText: null,
      initialHeader: null,
      eligibleCriteriaCopy: {
        usAzFunctionalLiteracyComplete: {
          text: "Functional literacy complete",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
        },
        minimumOrMediumCustody: {
          text: "Classified as Minimum or Medium security",
          tooltip:
            "Inmates must be classified by the department as minimum or medium custody as determined by an objective risk assessment.",
        },
        usAzNotServingSexOffense: {
          text: "Not convicted of an ineligible sexual crime",
          tooltip:
            "Inmates must not have been convicted of a sexual offense pursuant to title 13, chapter 14 or a violation of title 13, chapter 17.",
        },
        usAzNotServingIneligibleOffense: {
          text: "Not convicted of an ineligible violent crime",
          tooltip:
            "Inmates must not have been convicted of a violent crime as defined in section 13-901.03, unless the inmate was convicted of assault, aggravated assault or robbery.",
        },
        noFelonyDetainers: { text: "No felony detainers" },
        usAzNoMajorViolation6Months: {
          text: "No major rule violation in past six months",
        },
      },
      ineligibleCriteriaCopy: {
        usAzFunctionalLiteracyComplete: {
          text: "Functional literacy outstanding",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
        },
        noFelonyDetainers: { text: "Has one or more felony detainers" },
        usAzNoMajorViolation6Months: {
          text: "One or more major rule violation in the past six months",
        },
      },
      sidebarComponents: ["Incarceration"],
      methodologyUrl: "https://example.com",
      isAlert: false,
      priority: "NORMAL",
      tabGroups: null,
      compareBy: null,
      notifications: [],
      systemType: "INCARCERATION",
      urlSection: "TPR",
      firestoreCollection: "US_AZ-TPRReferrals",
      homepagePosition: 1,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
