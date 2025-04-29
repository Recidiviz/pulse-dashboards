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
          key: "RESTITUTION",
          text: "Does not demonstrate a good faith effort to comply with restitution, supervision and crime victim fees",
        },
        {
          key: "FEES",
          text: "Does not demonstrate a good faith effort to comply with court costs, fines and related fees",
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
          text: "Successfully complete three years on low supervision",
          tooltip: "as determined by the Texas Risk Assessment System score",
        },
        {
          key: "usTxNoWarrantWithSustainedViolationWithin2Years",
          text: "Has no warrant issued during the previous two years of the current parole\nsupervision period",
          tooltip:
            "This does not apply to a warrant issued where subsequently an investigation or administrative review did not sustain a violation.",
        },
        {
          key: "noSupervisionSustainedViolationWithin2Years",
          text: "Have no parole violations during the previous two years of the current parole supervision period",
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
          text: "Demonstrate a good faith effort to comply with restitution, supervision and crime victim fees, if applicable",
        },
        {
          text: "Demonstrate a good faith effort to comply with court costs, fines and related fees, if applicable",
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
    usTxEarlyReleaseFromSupervision: {
      callToAction: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "RESTITUTION",
          text: "Does not demonstrate a good faith effort to comply with restitution, supervision and crime victim fees",
        },
        {
          key: "FEES",
          text: "Does not demonstrate a good faith effort to comply with court costs, fines and related fees",
        },
        {
          key: "OFFENSE",
          text: "Has a felony conviction that include the use of a child or an intent to commit sexual assault, bodily harm, etc",
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
          key: "onSupervisionAtLeast2Years",
          text: "Have been on supervision for two years or more",
        },
        {
          key: "supervisionLevelIsMinimumFor1Year",
          text: "Successfully complete one year on Low supervisionas determined by the Texas Risk Assessment System score",
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
          text: "Demonstrate a good faith effort to comply with restitution, supervision and crime victim fees, if applicable",
        },
        {
          text: "Demonstrate a good faith effort to comply with court costs, fines and related fees, if applicable",
        },
        {
          text: "Have no felony convictions that include the use of a child or an intent to commit sexual assault, bodily harm, etc",
          tooltip:
            "Have no current or prior felony convictions or deferred adjudication, including juvenile convictions for the offense that includes the use of a child in the commission of a crime, nor any offenses that were pled down to a lesser degree but may have included an intent to commit sexual assault, bodily harm, etc.",
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
        "\nSupervision clients may be eligible transfer to Early Release From Supervision if they meet certain criteria. The official policy doc can be found [here](https://www.tdcj.texas.gov/documents/pd/03.02.30_parole_policy.pdf) effective Nov 5, 2013. Review potentially eligible clients below.",
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
