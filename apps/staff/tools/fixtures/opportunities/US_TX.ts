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
    usTxAnnualReportStatus: {
      callToAction: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "FEES ",
          text: "Client does not demonstrate a good faith effort to comply with supervision, crime victim fees and Post Secondary Education reimbursement",
        },
        {
          key: "RESTITUTION",
          text: "Client has not maintained compliance with all restitution obligations in accordance to PD/POP-3.1.6 for the preceding two years of supervision",
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
          key: "supervisionLevelIsMinimumFor3Years",
          text: "The client has satisfactorily completed three years on Low supervision",
          tooltip: "As determined by the Texas Risk Assessment System (TRAS)",
        },
        {
          key: "usTxNoWarrantWithSustainedViolationWithin2Years",
          text: "The client has not had a warrant issued within the preceding two years of supervision.  This does not apply to a warrant issued in which a subsequent investigation or administrative review did not sustain the violation.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TX-annualReportStatusReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Review clients who may be eligible for Annual Report Status",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf",
      nonOmsCriteria: [
        {
          text: "The client has demonstrated a good faith effort to comply with supervision, crime victim fees and Post Secondary Education reimbursement",
        },
        {
          text: "The client has maintained compliance with all restitution obligations  for the preceding two years of supervision",
          tooltip: "In accordance to PD/POP-3.1.6",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: " Requirements validated by OIMS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_TX",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Supervision clients may be eligible for Annual Report Status if they meet certain criteria. The official policy doc can be found [here](https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf) effective Nov 5, 2013. Review potentially eligible clients below.",
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for Annual Report Status",
      urlSection: "AnnualReportStatus",
      zeroGrantsTooltip: null,
    },
    usTxEarlyReleaseFromSupervision: {
      callToAction: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "FEES",
          text: "Client does not demonstrate a good faith effort to comply with supervision, crime victim fees and Post Secondary Education reimbursement",
        },
        {
          key: "RESTITUTION",
          text: "Client has not maintained compliance with all restitution obligations in accordance to PD/POP-3.1.6 for the preceding two years of supervision",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Early Release From Supervision",
      dynamicEligibilityText:
        "clients may be eligible for Early Release From Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usTxNoWarrantWithSustainedViolationWithin2Years",
          text: "Have no warrant issued during the previous two years of the current parole supervision period. ",
          tooltip:
            "This does not apply to a warrant issued where subsequently an investigation or administrative review did not sustain a violation",
        },
        {
          key: "noSupervisionSustainedViolationWithin2Years",
          text: "Have not committed any violation of rules or conditions of release as indicated on the release certificate, during the preceding two year period",
        },
        {
          key: "usTxServedAtLeastHalfOfRemainingSupervisionSentence",
          text: "Have been under supervision for at least one half of the time that remained on their sentence when released to parole or mandatory supervision",
        },
        {
          key: "supervisionLevelIsMinimumFor3Years",
          text: "The client has satisfactorily completed three years on Low supervision",
          tooltip: "As determined by the Texas Risk Assessment System (TRAS)",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TX-earlyReleaseFromSupervisionReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Review clients who may be eligible to transfer to Early Release From Supervision",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf",
      nonOmsCriteria: [
        {
          text: "The client has demonstrated a good faith effort to comply with supervision, crime victim fees and Post Secondary Education reimbursement",
        },
        {
          text: "The client has maintained compliance with all restitution obligations  for the preceding two years of supervision",
          tooltip: "In accordance to PD/POP-3.1.6",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: "Requirements validated by OIMS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_TX",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Supervision clients may be eligible transfer to Early Release From Supervision if they meet certain criteria. The official policy doc can be found [here](https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf) effective Nov 5, 2013. Review potentially eligible clients below.",
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for Early Release From Supervision",
      urlSection: "EarlyReleaseFromSupervision",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
