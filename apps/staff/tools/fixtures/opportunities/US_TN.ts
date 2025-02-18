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
    compliantReporting: {
      callToAction:
        "Review and refer eligible clients for Compliant Reporting.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "DECF", text: "DECF: No effort to pay fine and costs" },
        { key: "DECR", text: "DECR: Criminal record" },
        { key: "DECT", text: "DECT: Insufficient time in supervision level" },
        { key: "DEDF", text: "DEDF: No effort to pay fees" },
        { key: "DEDU", text: "DEDU: Serious compliance problems " },
        { key: "DEIJ", text: "DEIJ: Not allowed per court" },
        { key: "DEIR", text: "DEIR: Failure to report as instructed" },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Compliant Reporting",
      dynamicEligibilityText:
        "client[|s] may be eligible for Compliant Reporting",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [],
      firestoreCollection: "compliantReportingReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1YNAUTViqg_Pgt15KsZPUiNG11Dh2TTiB/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "SpecialConditions",
        "ClientProfileDetails",
        "FinesAndFees",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TN",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Compliant Reporting is a level of supervision that uses an interactive voice recognition system, rather than requiring regular face-to-face contacts. Review and refer eligible clients for Compliant Reporting using the autofilled paperwork.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "compliantReporting",
      zeroGrantsTooltip: null,
    },
    supervisionLevelDowngrade: {
      callToAction: "Change their supervision level in TOMIS.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "COURT",
          text: "COURT: Court mandates supervision at a higher level",
        },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Supervision Level Downgrade",
      dynamicEligibilityText:
        "client[|s] may be supervised at a higher level than their latest risk score",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "supervisionLevelHigherThanAssessmentLevel",
          text: "Current supervision level: {{supervisionLevel}}; Last risk score: {{assessmentLevel}} {{#if latestAssessmentDate}}(as of {{date latestAssessmentDate}}){{else}}(assessment date unknown){{/if}}",
          tooltip: null,
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TN-supervisionLevelDowngrade",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 4,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: true,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TN",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify people who may be supervised at a higher level than their latest risk score and directs staff to update their supervision level in eTOMIS.\n  \nClients are surfaced if their latest risk score does not map to the corresponding supervision level as detailed below:\n\n* Low - Minimum or lower\n* Moderate - Medium or lower\n* High Property - Max or lower\n    ",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "supervisionLevelDowngrade",
      zeroGrantsTooltip: null,
    },
    usTnAnnualReclassification: {
      callToAction:
        "Review residents due for their annual reclassification and update their custody level in TOMIS.",
      compareBy: [{ field: "releaseDate" }],
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Annual Reclassification",
      dynamicEligibilityText:
        "resident[|s] [is|are] eligible for their annual reclassification",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usTnAtLeast12MonthsSinceLatestAssessment",
          text: "At least 12 months since last reclassification date",
          tooltip: null,
        },
        {
          key: "custodyLevelIsNotMax",
          text: "Custody level is not maximum",
          tooltip: null,
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TN-annualReclassificationReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 4,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "CaseNotes",
        "UsTnCommonlyUsedOverrideCodes",
      ],
      snooze: null,
      stateCode: "US_TN",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents who are due for annual custody reclassification and directs staff to complete & submit new classification paperwork.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "annualReclassification",
      zeroGrantsTooltip: null,
    },
    usTnCustodyLevelDowngrade: {
      callToAction: "Review and update custody levels.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [{ key: "Other", text: "Please specify a reason" }],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Custody Level Downgrade",
      dynamicEligibilityText:
        "resident[|s] may be eligible for a custody level downgrade",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "custodyLevelHigherThanRecommended",
          text: "Custody level is higher than latest CAF score suggests",
          tooltip: null,
        },
        {
          key: "custodyLevelIsNotMax",
          text: "Custody level is not maximum",
          tooltip: null,
        },
        {
          key: "usTnIneligibleForAnnualReclassification",
          text: "Not eligible for annual reclassification",
          tooltip: null,
        },
        {
          key: "usTnLatestCafAssessmentNotOverride",
          text: "Last assessment did not include an override",
          tooltip: null,
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TN-custodyLevelDowngradeReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "CaseNotes",
        "UsTnCommonlyUsedOverrideCodes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TN",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents who may be at a higher custody level than recommended and directs staff to complete & submit new classification paperwork based on the resident's latest CAF score.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "custodyLevelDowngrade",
      zeroGrantsTooltip: null,
    },
    usTnExpiration: {
      callToAction:
        "Review these clients and complete their auto-generated TEPE Note.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "DATE", text: "DATE: Expiration date is incorrect or missing" },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Expiration",
      dynamicEligibilityText:
        "client[|s] may be on or past their expiration date",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "supervisionPastFullTermCompletionDateOrUpcoming1Day",
          text: "{{#if (eq 0 (daysPast eligibleDate))}}Expiration date is today{{else}}{{#if (eq 1 (daysPast eligibleDate))}}1 day{{else}}{{daysPast eligibleDate}} days{{/if}} past expiration date{{/if}} ({{date eligibleDate}})",
          tooltip: null,
        },
        {
          key: "usTnNoZeroToleranceCodesSpans",
          text: "No zero tolerance codes since most recent sentence imposed date",
          tooltip: null,
        },
        {
          key: "usTnNotOnLifeSentenceOrLifetimeSupervision",
          text: "Not on lifetime supervision or lifetime sentence",
          tooltip: null,
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TN-expirationReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Search for officers above to review clients who may be on or past their supervision expiration date.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1IpetvPM49g_c-D-HzGdf7v6QAe_z5IHn/view?usp=sharing",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: {
        autoSnoozeParams: { params: { days: 30 }, type: "snoozeDays" },
      },
      stateCode: "US_TN",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify clients whose expiration dates are today or in the past. Complete a pre-populated discharge note (TEPE) and copy note to eTOMIS.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "expiration",
      zeroGrantsTooltip: null,
    },
    usTnSuspensionOfDirectSupervision: {
      callToAction: "Generate request",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "TIME", text: "Insufficient time on supervision" },
        { key: "CASE PLAN", text: "Has not reached case plan goals" },
        {
          key: "CONDITIONS",
          text: "Special conditions incomplete / not compliant",
        },
        {
          key: "FINANCIAL",
          text: "Not meeting financial obligations to court and/or victim",
        },
        { key: "CHARGES", text: "Pending criminal charges" },
        {
          key: "JURISDICTION",
          text: "Under active supervision in another jurisdiction",
        },
        { key: "INDICTMENT", text: "Under indictment" },
        { key: "OTHER", text: "Please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Suspension of Direct Supervision",
      dynamicEligibilityText:
        "client[|s] [is|are] eligible for Suspension of Direct Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "onSupervisionAtLeast2Years",
          text: "On supervision for at least two years",
          tooltip:
            "On supervision for two years, including compliant reporting, unless removed from compliant reporting due to the imposition of a sanction.",
        },
        {
          key: "noSupervisionViolationReportWithin2Years",
          text: "No violation reports submitted in past two years",
        },
        {
          key: "usTnNoWarrantWithin2Years",
          text: "No warrants in past two years",
        },
        {
          key: "assessedRiskLowAtLeast2Years",
          text: "Overall risk score of 'minimum' for at least two years",
        },
        {
          key: "usTnNoSupervisionSanctionWithin1Year",
          text: "Has not been sanctioned in the past year",
        },
        {
          key: "atLeast12MonthsSinceMostRecentPositiveDrugTest",
          text: "Has not tested positive for any substance within the last year without a valid prescription",
        },
        {
          key: "hasFinesFeesBalanceOf0OrIsExempt",
          text: "Is current on supervision fee obligations as they apply to the current sentence",
        },
        {
          key: "latestDrugTestIsNegative",
          text: "Has successfully passed the most recent drug screen",
          tooltip:
            "Clients must have successfully passed the most recent drug screen prior to the request for Suspension of Direct Supervision.",
        },
        {
          key: "usTnNotOnCommunitySupervisionForLife",
          text: "Not supervised under a Community Supervision for Life (CSL) certificate",
        },
        {
          key: "usTnNoArrestsInPast2Years",
          text: "No arrests within the last two years",
          tooltip: "No arrests within the last two years.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TN-suspensionOfDirectSupervisionReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 5,
      ineligibleCriteriaCopy: [
        {
          key: "hasFinesFeesBalanceOf0OrIsExempt",
          // eslint-disable-next-line no-template-curly-in-string
          text: "Unpaid balance of ${{amountOwed}}",
        },
      ],
      initialHeader:
        "Review clients who may be eligible and complete the Direct Supervision Suspension Request form.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "https://recidiviz.org",
      nonOmsCriteria: [
        {
          text: "Has reached all goals for two consecutive offender case plans",
        },
        {
          text: "Client’s criminal activity, reintegration, job, housing, and community behavior have been assessed",
          tooltip:
            "Officers must consider the client's criminal involvement and associations, adjustment to community release, progress toward stable employment/education, housing, and pro-social behaviors within the community. ",
        },
        {
          text: "Has completed all special conditions of supervision and/or is in compliance with conditions",
        },
        {
          text: "In compliance with the agreed payment plan for the last year",
          tooltip:
            "Clients must meet all financial obligations to the court and/or victim as outlined in an agreed payment plan, or be otherwise exempted, and must be in compliance with the agreed payment plan for the previous 12 months. ",
        },
        { text: "No pending criminal charges in any jursidiction" },
        { text: "Not under active supervision in any other jurisdiction" },
        { text: "Is not under indictment" },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: "Validated by data from TOMIS",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "ClientProfileDetails",
        "SpecialConditions",
        "FinesAndFees",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TN",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Suspension of Direct Supervision is a type of supervision for clients on parole that removes the requirement for clients to meet in person with officers. Clients will remain on parole and must adhere to all rules and conditions. For official policy details, see Policy #708.05.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "suspensionOfDirectSupervision",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
