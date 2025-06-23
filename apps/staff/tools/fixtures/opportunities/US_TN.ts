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
      snoozeCompanionOpportunityTypes: [],
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
        { key: "COURT", text: "Court mandates supervision at a higher level" },
        {
          key: "SCORE",
          text: "New StrongR 2.0 score cut offs mean the new supervision level is aligned with the latest assessment score",
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
          text: "Current supervision level: {{opportunity.person.supervisionLevel}}; Last risk score: {{assessmentLevel}} {{#if latestAssessmentDate}}(as of {{date latestAssessmentDate}}){{else}}(assessment date unknown){{/if}}",
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
      snoozeCompanionOpportunityTypes: [],
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
      snoozeCompanionOpportunityTypes: [],
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
    usTnCompliantReporting2025Policy: {
      callToAction: "Auto-fill referral",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "CONTACT",
          text: "Hasn't had 3 face-to-face contacts (or doesn't have them scheduled) within 60 days",
        },
        { key: "FELONY", text: "Has pending felony charges" },
        {
          key: "REPORTING",
          text: "Hasn't reported as instructed for 3 months ",
        },
        {
          key: "CONDITIONS",
          text: "Hasn't complied with Court/Board of Parole conditions",
        },
        {
          key: "NEEDS",
          text: "Isn't addressing high assessed criminogenic needs",
        },
        {
          key: "CASE",
          text: "On supervision for highly publicized case, sex offense or domestic violence",
        },
        { key: "FEE", text: "No effort to pay fees" },
        { key: "JUDGE", text: "Denied by judge order" },
        { key: "EXPIRE", text: "Too close to expiration date" },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Compliant Reporting - 2025 Policy",
      dynamicEligibilityText:
        "client[|s] may be eligible for Compliant Reporting",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "onMinimumSupervisionAtLeastSixMonths",
          text: "On Low supervision level for 6+ months",
          tooltip: "",
        },
        {
          key: "onUnassignedFor60Days",
          text: "On intake for 60+ days",
          tooltip: "Clients must be on intake for 60 days",
        },
        {
          key: "noSupervisionViolationReportWithin6Months",
          text: "No violations in the past 6 months",
        },
        {
          key: "noSupervisionViolationReportSinceUnassignedSupervisionLevel",
          text: "No violations since being placed on Community Supervision",
        },
        {
          key: "usTnNoSupervisionSanctionWithin3Months",
          text: "No sanctions in the past 3 months",
        },
        {
          key: "usTnNoSupervisionSanctionSinceUnassignedSupervisionLevel",
          text: "No sanctions since being placed on Community Supervision",
        },
        {
          key: "latestDrugTestIsNegativeOrMissing",
          text: ' {{#if  (eq latestDrugScreenDate "")}}\nNo recent drug screens\n{{else}}\nPassed most recent drug screen on {{date latestDrugScreenDate}}\n{{/if}}\n\n',
          tooltip:
            "Tested negative on their most recent drug screen or have no drug tests",
        },
        {
          key: "noPositiveDrugScreensSinceUnassignedSupervisionLevel",
          text: "No positive drug screens since being placed on Community\nSupervision.",
        },
        {
          key: "usTnNoArrestsInPast6Months",
          text: "Negative arrest check on {{date record.metadata.latestNegativeArrestCheck.contactDate}}",
          tooltip: "Client has had no arrests in the past 6 months",
        },
        {
          key: "usTnAssessedNotHighOnStrongRDomains",
          text: "No high needs as of {{date assessmentDate}}",
          tooltip:
            "Have addressed or are addressing any highly assessed criminogenic needs.",
        },
        {
          key: "assessedRiskLowAfterUnassignedSupervisionLevel",
          text: "Assessed Low after starting on Intake, latest assessment on {{date assessmentDate}}",
        },
        {
          key: "usTnThreeFaceToFaceContactsWithin60DaysOfUnassignedSupervisionStart",
          text: "At least three face-to-face contacts since intake start on \n\n{{#each faceToFaceContactsArray as |obj|}}\n{{date obj.contactDate}} ({{obj.contactType}});\n{{/each}}",
          tooltip:
            "Clients must have three face-to-face contacts within the first 60 days of being placed on Community Supervision. Note: Clients with a third contact scheduled in the future can be eligible based on officer discrection.",
        },
        {
          key: "usTnHomeVisitSinceUnassignedSupervisionLevel",
          text: "First home visit since intake on {{date eligibleDate}}",
        },
        {
          key: "usTnFeeScheduleOrPermanentExemption",
          text: " {{#if  (eq latestFeeContactDate null)}}\nHas permanent exemption {{currentExemptions}}\n\n{{else}}\n {{#if  (eq currentExemptions null)}}\nLatest FEEP on {{date latestFeeContactDate}}\n{{else}}\nLatest FEEP on {{date latestFeeContactDate}}, has permanent exemption {{currentExemptions}}\n{{/if}}\n{{/if}}\n\n\n\n\n",
          tooltip:
            "Clients who've had a FEEP code in the last 90 days are surfaced as eligible or have a permanent exemption",
        },
        {
          key: "usTnNotOnCommunitySupervisionForLife",
          text: "Not currently on supervision as convicted sex offender",
          tooltip:
            "Client isn't on Sex Offense Unit (SCU), doesn't have Community Supervision for Life, and doesn't have a sex offense listed in \"type of offense\". For reference, all current offenses are listed in client record.",
        },
        {
          key: "usTnNotServingIneligibleCrOffensePolicyB",
          text: "Not currently on supervision for domestic violence",
          tooltip:
            'Client doesn\'t have a DV offense listed in "type of offense". For reference, all current offenses are listed in client record. ',
        },
        {
          key: "usTnNotInDayReportingCenter",
          text: "Not in day reporting center",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "usTnCompliantReporting2025PolicyReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 6,
      ineligibleCriteriaCopy: [
        {
          key: "onMinimumSupervisionAtLeastSixMonths",
          text: "Needs {{daysUntil minimumTimeServedDate}} more days on Low",
        },
        {
          key: "usTnFeeScheduleOrPermanentExemption",
          text: "Confirm the client has a fee payment schedule in place if applicable",
          tooltip:
            "Clients who've had a FEEP code in the last 90 days are surfaced as eligible",
        },
        {
          key: "usTnAssessedNotHighOnStrongRDomains",
          text: "Has at least one high need domain",
          tooltip:
            "Have addressed or are addressing any highly assessed criminogenic needs.",
        },
        {
          key: "onUnassignedFor60Days",
          text: "Needs {{daysUntil minimumTimeServedDate}} more days on Intake",
          tooltip: "Clients must be on intake for 60 days",
        },
        {
          key: "usTnThreeFaceToFaceContactsWithin60DaysOfUnassignedSupervisionStart",
          text: "Did not have 3 face to face contacts within 60 days of starting Intake. Has had contacts on {{#each faceToFaceContactsArray as |obj|}}\n{{date obj.contactDate}} ({{obj.contactType}});\n{{/each}}",
          tooltip:
            "Clients must have three face-to-face contacts within the first 60 days of being placed on Community Supervision. Note: Clients with a third contact scheduled in the future can be eligible based on officer discrection.",
        },
      ],
      initialHeader:
        "Review and refer eligible clients for Compliant Reporting using the autofilled paperwork.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1YNAUTViqg_Pgt15KsZPUiNG11Dh2TTiB/view",
      nonOmsCriteria: [
        {
          text: "No pending felony charges",
          tooltip:
            "See VWARs submitted on current supervision period for information on potential pending felony charges",
        },
        {
          text: "Has reported as instructed for the past 3 months (unless excused or documented)",
        },
        {
          text: "Able to comply with any Court/Board of Parole ordered special conditions",
        },
        {
          text: "Not currently on supervision for highly publicized case",
          tooltip:
            "For reference, all current offenses are listed in client record.",
        },
        {
          text: "Approved by judge if in relevant county or judicial district",
          tooltip:
            "Certain judicial districts and counties require case-by-case judge approval.",
        },
        {
          text: "Upcoming sentence expiration date checked",
          tooltip:
            "There's no official policy cutoff for sentence expiration dates that are too soon for someone to be moved to Compliant  Reporting.",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: "Validated by data from TOMIS",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "SpecialConditions",
        "ClientProfileDetails",
        "FinesAndFees",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_TN",
      subcategoryHeadings: [
        { subcategory: "MISSING_1_CRITERIA", text: "Missing 1 Criteria" },
        { subcategory: "MISSING_2_CRITERIA", text: "Missing 2 Criteria" },
        { subcategory: "MISSING_3_CRITERIA", text: "Missing 3 Criteria" },
        { subcategory: "MISSING_4_CRITERIA", text: "Missing 4 Criteria" },
      ],
      subcategoryOrderings: [
        {
          tab: "Almost Eligible",
          texts: [
            "MISSING_1_CRITERIA",
            "MISSING_2_CRITERIA",
            "MISSING_3_CRITERIA",
            "MISSING_4_CRITERIA",
          ],
        },
      ],
      subheading:
        "Compliant Reporting is a level of supervision that uses an interactive voice recognition system, rather than requiring regular face-to-face contacts. ",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "usTnCompliantReporting2025Policy",
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
      snoozeCompanionOpportunityTypes: [],
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
        },
        {
          key: "usTnNoZeroToleranceCodesSpans",
          text: "No zero tolerance codes since most recent sentence imposed date",
        },
        {
          key: "usTnNotOnLifeSentenceOrLifetimeSupervision",
          text: "Not on lifetime supervision or lifetime sentence",
        },
        {
          key: "supervisionPastFullTermCompletionDate",
          text: "{{#if (eq 0 (daysPast eligibleDate))}}Expiration date is today{{else}}{{#if (eq 1 (daysPast eligibleDate))}}1 day{{else}}{{daysPast eligibleDate}} days{{/if}} past expiration date{{/if}} ({{date eligibleDate}})",
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
      snoozeCompanionOpportunityTypes: [],
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
    usTnInitialClassification: {
      callToAction: "Auto-fill paperwork",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "START",
          text: "Has already had an initial classification since latest start in TDOC custody",
        },
        { key: "MAX", text: "Is on Maximum Custody" },
        { key: "OTHER", text: "Please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Initial Classification",
      dynamicEligibilityText:
        " resident[|s] may need an Initial Classification",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "notHasInitialClassificationInStatePrisonCustody",
          text: "Has not had initial classification since latest start in TDOC custody",
        },
        { key: "custodyLevelIsNotMax", text: "Custody level is not Max" },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_TN-initialClassificationReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 7,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Complete and submit new classification paperwork for eligible residents. ",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by data from TOMIS",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "CaseNotes",
        "UsTnCommonlyUsedOverrideCodes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_TN",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This tool helps staff identify residents who have not had an Initial Classification since their latest start in TDOC custody. ",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "initialClassification",
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
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Suspension of Direct Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for Suspension of Direct Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "onSupervisionAtLeast2YearsAndAssessedRiskLowWhileOnSupervisionAtLeast2Years",
          text: "On supervision with an overall risk score of 'minimum' for at least two years",
          tooltip:
            "On supervision with a 'minimum' risk score for two years, including time on Compliant Reporting unless removed from Compliant Reporting due to the imposition of a sanction.",
        },
        {
          key: "noSupervisionViolationReportWithin2Years",
          text: "No violation reports submitted in past two years",
          tooltip:
            "No submission of violation reports in past two years. Recidiviz uses the date of any underlying violation(s) associated with a violation report to check this eligibility requirement.",
        },
        {
          key: "usTnNoWarrantWithin2Years",
          text: "No warrants in past two years",
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
          text: "Has successfully passed the most recent drug screen ({{date latestDrugScreenDate}})",
          tooltip:
            "Clients must have successfully passed the most recent drug screen prior to the request for Suspension of Direct Supervision. In some cases, a more recent screen may be required at the discretion of administrators or the ACCS.",
        },
        {
          key: "usTnNotOnCommunitySupervisionForLife",
          text: "Not supervised under a Community Supervision for Life (CSL) certificate",
        },
        {
          key: "usTnNoArrestsInPast2Years",
          text: "Negative arrest check on {{date record.metadata.latestNegativeArrestCheck.contactDate}}",
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
          key: "onSupervisionAtLeast2YearsAndAssessedRiskLowWhileOnSupervisionAtLeast2Years",
          text: "Within 60 days of being on supervision with an overall risk score of 'minimum' for at least two years",
          tooltip:
            "On supervision with a 'minimum' risk score for two years, including time on Compliant Reporting unless removed from Compliant Reporting due to the imposition of a sanction.",
        },
        {
          key: "hasFinesFeesBalanceOf0OrIsExempt",
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
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_TN",
      subcategoryHeadings: [
        {
          subcategory: "INSUFFICIENT_TIME_ACCRUED",
          text: "Approaching Eligibility Date",
        },
        {
          subcategory: "HAS_FINES_FEES_BALANCE",
          text: "Has Fines and Fees Balance",
        },
      ],
      subcategoryOrderings: [
        {
          tab: "Almost Eligible",
          texts: ["INSUFFICIENT_TIME_ACCRUED", "HAS_FINES_FEES_BALANCE"],
        },
      ],
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
