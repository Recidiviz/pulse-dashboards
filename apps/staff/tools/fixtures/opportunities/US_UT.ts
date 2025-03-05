// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
    usUtEarlyTermination: {
      callToAction: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [{ key: "OTHER", text: "Other, please enter a reason" }],
      denialText: null,
      deniedTabTitle: "Pending – Ineligible",
      displayName: "Early Termination of Probation",
      dynamicEligibilityText:
        "client[|s] have upcoming reports due for Early Termination of Probation",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [
        {
          tab: "Report Due",
          text: "At this time, there are no clients who have a report due. Please navigate to one of the other tabs.",
        },
      ],
      firestoreCollection: "US_UT-earlyTerminationReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "supervisionContinuousEmploymentFor3Months",
          text: "PLACEHOLDER TEXT supervisionContinuousEmploymentFor3Months",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "https://dashboard.recidiviz.org",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by OTrack data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [],
      snooze: {
        autoSnoozeParams: { params: { days: 30 }, type: "snoozeDays" },
      },
      stateCode: "US_UT",
      subcategoryHeadings: [
        { subcategory: "REPORT_DUE_ELIGIBLE", text: "Eligible" },
        { subcategory: "REPORT_DUE_ALMOST_ELIGIBLE", text: "Almost Eligible" },
      ],
      subcategoryOrderings: [
        {
          tab: "Report Due",
          texts: ["REPORT_DUE_ELIGIBLE", "REPORT_DUE_ALMOST_ELIGIBLE"],
        },
      ],
      subheading: null,
      submittedTabTitle: "Pending – Meets Requirements",
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Report Due",
            "Early Requests",
            "Pending – Meets Requirements",
            "Pending – Ineligible",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "EarlyTermination",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
