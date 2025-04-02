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
    usTxAnnualReportingStatus: {
      callToAction: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "COS",
          text: "Not current on Supervision and Crime Victim Fund fees (if applicable)",
        },
        {
          key: "RESTITUTION",
          text: "Court-mandated restitution and Post Secondary Education Reimbursement (if applicable) not yet paid in full",
        },
        {
          key: "FEES",
          text: "Court costs, fines, and related fees not yet paid in full",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Annual Report Status",
      dynamicEligibilityText:
        "clients may be eligible for Annual Report Status",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "onMinimumSupervisionAtLeast1Year",
          text: "Satisfactorily complete one (1) year on Low supervision",
        },
        {
          key: "usTxNotConvictedOfIneligibleOffenseForArs",
          text: "Has no current or prior convictions or deferred adjudication for a non-qualifying offense",
        },
        {
          key: "usTxNoWarrantWithSustainedViolationWithin7Years",
          text: "Has no warrant issued during the previous seven years of the current parole\nsupervision period",
          tooltip:
            "This does not apply to a warrant issued where subsequently an investigation or administrative review did not sustain a violation.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TX-annualReportingStatusReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Review clients who may be eligible to transfer to Annual Report Status",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf",
      nonOmsCriteria: [
        {
          text: "Must be current on Supervision and Crime Victim Fund fees (if applicable)",
          tooltip:
            "Fees continue to be due for payment each month unless paid in advance.",
        },
        {
          text: "Must have court-mandated restitution and Post Secondary Education Reimbursement (if applicable) paid in full",
        },
        { text: "Must have court costs, fines, and related fees paid in full" },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: "Requirements validated by OIMS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TX",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Supervision clients may be eligible transfer to Annual Report Status if they meet certain criteria. The official policy doc can be found [here](https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf) effective Nov 5, 2013. \n\nReview potentially eligible clients below.",
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for Annual Report Status",
      urlSection: "AnnualReportingStatus",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
