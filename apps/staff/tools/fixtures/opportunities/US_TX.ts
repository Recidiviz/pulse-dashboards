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
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "FEES ",
          text: "Client has not demonstrated a good faith effort to comply with supervision, crime victim fees and Post Secondary Education reimbursement",
        },
        {
          key: "RESTITUTION",
          text: "Client has not maintained compliance with all restitution obligations in accordance to PD/POP-3.1.6 for the preceding two years of supervision",
        },
        {
          key: "DISCRETION",
          text: "Per the PO’s discretion, it is not in the best interest of society for the client’s reporting status to be modified to Annual Report",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Annual Report Status",
      dynamicEligibilityText:
        "client[|s] may be eligible for Annual Report Status",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "supervisionLevelIsMinimumFor3Years",
          text: "Has successfully completed three years on Low supervision",
          tooltip: "As determined by the Texas Risk Assessment System (TRAS)",
        },
        {
          key: "usTxNoWarrantWithSustainedViolationWithin2Years",
          text: "Has had no warrants issued within the preceding two years of supervision",
          tooltip:
            "This does not apply to a warrant issued in which a subsequent investigation or administrative review did not sustain the violation.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TX-annualReportStatusReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Review clients who may be eligible for Annual Report Status",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf",
      nonOmsCriteria: [
        {
          text: "The client has demonstrated a good faith effort to comply with supervision, crime victim fees and Post Secondary Education reimbursement, if applicable",
          tooltip:
            "Any supervision, crime victim fees and Post Secondary Education reimbursement which will continue to be due each month, unless paid in advance, while client is on Annual Report status.",
        },
        {
          text: "The client has maintained compliance with all restitution obligations for the preceding two years of supervision",
          tooltip:
            "Note: Restitution obligation does not have to be paid in full to qualify. Restitution will continue to be due each month until fully paid while client is on Annual Report status.\nIn accordance to PD/POP-3.1.6",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [
        {
          body: "ARS/ERS Policy changes went into effect on July 21, 2025. Learn what this means for you: [FAQ](https://docs.google.com/document/d/e/2PACX-1vSZ6cUATsrYOH4x72IbC3EnULM651f2taDj-rXDqVMdMrCQC_OIscuqWV0rslrlZfZeLHDQrO2af7QY/pub)",
          cta: "Acknowledge & Close",
          id: "3f78cf16-ed4f-4ea0-9c7b-903d1c5c9bf9",
        },
      ],
      omsCriteriaHeader: " Requirements validated by OIMS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_TX",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Supervision clients may be eligible for Annual Report Status if they meet certain criteria. The official policy doc can be found [here](https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf) effective Jul 1, 2025. Review clients who may be eligible below.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for Annual Report Status",
      urlSection: "AnnualReportStatus",
      zeroGrantsTooltip: null,
    },
    usTxEarlyReleaseFromSupervision: {
      callToAction: null,
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "FEES",
          text: "Client has not demonstrated a good faith effort to comply with supervision, crime victim fees and Post Secondary Education reimbursement",
        },
        {
          key: "RESTITUTION",
          text: "Client has not maintained compliance with all restitution obligations in accordance to PD/POP-3.1.6 for the preceding two years of supervision",
        },
        {
          key: "DISCRETION",
          text: "Per the PO’s discretion, it is not in the best interest of society for the client’s reporting status to be modified to Early Release",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Early Release from Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for Early Release from Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usTxServedAtLeastHalfOfRemainingSupervisionSentence",
          text: "Has been under supervision for at least one half of the time that remained on their sentence when released to parole or mandatory supervision",
        },
        {
          key: "supervisionLevelIsMinimumFor3Years",
          text: "Has satisfactorily completed three years on Low supervision",
          tooltip: "As determined by the Texas Risk Assessment System (TRAS)",
        },
        {
          key: "usTxNoWarrantWithSustainedViolationWithin2Years",
          text: "Has had no warrant issued during the previous two years of the current parole supervision period",
          tooltip:
            "This does not apply to a warrant issued where subsequently an investigation or administrative review did not sustain a violation",
        },
        {
          key: "noSupervisionSustainedViolationWithin2Years",
          text: "Has not committed any violation of rules or conditions of release, as indicated on the release certificate, during the preceding two year period",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TX-earlyReleaseFromSupervisionReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Review clients who may be eligible for Early Release from Supervision",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf",
      nonOmsCriteria: [
        {
          text: "The client has demonstrated a good faith effort to comply with supervision, crime victim fees and Post Secondary Education reimbursement, if applicable",
          tooltip:
            "Any supervision, crime victim fees and Post Secondary Education reimbursement will continue to be due each month, unless paid in advance, while client is on Early Release status.",
        },
        {
          text: "The client has maintained compliance with all restitution obligations for the preceding two years",
          tooltip:
            "Note: Restitution obligation does not have to be paid in full to qualify. Restitution will continue to be due each month until fully paid while client is on Early Release status.\n\nIn accordance to PD/POP-3.1.6",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [
        {
          body: "ARS/ERS Policy changes went into effect on July 21, 2025. Learn what this means for you: [FAQ](https://docs.google.com/document/d/e/2PACX-1vSZ6cUATsrYOH4x72IbC3EnULM651f2taDj-rXDqVMdMrCQC_OIscuqWV0rslrlZfZeLHDQrO2af7QY/pub)",
          cta: "Acknowledge & Close",
          id: "4ef11701-0b09-4b81-b5d0-20dcbe6e9d1a",
          title: "",
        },
      ],
      omsCriteriaHeader: "Requirements validated by OIMS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: ["usTxAnnualReportStatus"],
      stateCode: "US_TX",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Supervision clients may be eligible for Early Release from Supervision if they meet certain criteria. The official policy doc can be found [here](https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf) effective Jul 1, 2025. Review clients who may be eligible below.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for Early Release from Supervision",
      urlSection: "EarlyReleaseFromSupervision",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
