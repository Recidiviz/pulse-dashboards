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
    usAzOverdueForACISDTP: {
      callToAction: "Review and refer eligible clients",
      compareBy: null,
      denialReasons: {},
      denialText: null,
      displayName: "Overdue for Drug Transition Program",
      dynamicEligibilityText: "resident[|s] are past their DTP date",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usAzIncarcerationPastAcisDtpDate: {
          text: "Past DTP date in ACIS: {{date acisDtpDate}}",
        },
      },
      firestoreCollection: "US_AZ-OverdueForDTPReferrals",
      hideDenialRevert: false,
      homepagePosition: 2,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl: "http://example.com",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["Incarceration"],
      snooze: null,
      stateCode: "US_AZ",
      subheading: null,
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "OverdueForDTP",
    },
    usAzOverdueForACISTPR: {
      callToAction: "Review and refer eligible clients",
      compareBy: null,
      denialReasons: {},
      denialText: null,
      displayName: "Overdue for Standard Transition Program",
      dynamicEligibilityText:
        "resident[|s] may be past their Standard Transition Program date",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usAzIncarcerationPastAcisTprDate: {
          text: "Past TPR date in ACIS: {{date acisTprDate}}",
        },
      },
      firestoreCollection: "US_AZ-OverdueForTPRReferrals",
      hideDenialRevert: false,
      homepagePosition: 3,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl: "http://example.com",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: [],
      snooze: null,
      stateCode: "US_AZ",
      subheading: null,
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "OverdueForTPR",
    },
    usAzReleaseToTPR: {
      callToAction:
        "Review inmates who may be eligible for Standard Transition Program Release",
      compareBy: null,
      denialReasons: {},
      denialText: null,
      displayName: "Standard Transition Program Release",
      dynamicEligibilityText:
        "inmate[|s] may be eligible for Standard Transition Program Release",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usAzMeetsFunctionalLiteracy: {
          text: "Functional literacy complete",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
        },
        custodyLevelIsMinimumOrMedium: {
          text: "Classified as Minimum or Medium security",
          tooltip:
            "Inmates must be classified by the department as minimum or medium custody as determined by an objective risk assessment.",
        },
        usAzNoSexualOffenseConviction: {
          text: "Not convicted of an ineligible sexual crime",
          tooltip:
            "Inmates must not have been convicted of a sexual offense pursuant to title 13, chapter 14 or a violation of title 13, chapter 17.",
        },
        usAzNotServingIneligibleOffense: {
          text: "Not convicted of an ineligible violent crime",
          tooltip:
            "Inmates must not have been convicted of a violent crime as defined in section 13-901.03, unless the inmate was convicted of assault, aggravated assault or robbery.",
        },
        usAzNoActiveFelonyDetainers: { text: "No felony detainers" },
      },
      firestoreCollection: "US_AZ-TPRReferrals",
      hideDenialRevert: false,
      homepagePosition: 1,
      ineligibleCriteriaCopy: {
        usAzMeetsFunctionalLiteracy: {
          text: "Functional literacy outstanding",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
        },
        usAzNoActiveFelonyDetainers: {
          text: "Has one or more felony detainers",
        },
      },
      initialHeader: null,
      isAlert: false,
      methodologyUrl: "https://example.com",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["Incarceration"],
      snooze: { defaultSnoozeDays: 20, maxSnoozeDays: 45 },
      stateCode: "US_AZ",
      subheading: null,
      systemType: "INCARCERATION",
      tabGroups: {
        "ELIGIBILITY STATUS": [
          "Fast Trackers",
          "Approved by Time Comp",
          "Almost Eligible",
          "Pending",
        ],
      },
      tooltipEligibilityText: null,
      urlSection: "TPR",
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
