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
      denialReasons: [],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Annual Report Status",
      dynamicEligibilityText: "clients maybe eligible for Annual Report Status",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "onMinimumSupervisionAtLeast1Year",
          text: "Satisfactorily complete one (1) year on Low supervision",
        },
        {
          key: "usTxNotConvictedOfIneligibleOffenseForArs",
          text: "Have no current or prior convictions or deferred adjudication for a nonqualifying offense",
        },
        {
          key: "usTxNoWarrantWithSustainedViolationWithin7Years",
          text: "Have no warrant issued during the previous seven years of the current parole\nsupervision period. This does not apply to a warrant issued where subsequently\nan investigation or administrative review did not sustain a violation.",
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
          text: "Be current on Supervision and Crime Victim Fund fees (if applicable), which\ncontinue to be due for payment each month unless paid in advance",
        },
        {
          text: "Ensure court-mandated restitution and Post Secondary Education\nReimbursement (if applicable) are paid in full",
        },
        {
          text: "Ensure court costs, fines, and related fees are paid in full",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: "Requirements validated by OIMS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [],
      snooze: null,
      stateCode: "US_TX",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Supervision clients may be eligible transfer to Annual Report Status if they meet certain criteria. The official policy doc can be found here (https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf) effective Nov 5, 2013. Review potentially eligible clients below.",
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
