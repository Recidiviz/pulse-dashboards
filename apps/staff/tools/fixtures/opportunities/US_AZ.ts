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
    usAzReleaseToDTP: {
      callToAction: "",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "Detainer", text: "Active felony detainer" },
        { key: "Intake", text: "Currently in intake and assessment" },
        { key: "Conviction", text: "Prior disqualifying conviction" },
        {
          key: "Misconduct involving weapons",
          text: "Misconduct Involving Weapons: requires Time Comp review",
        },
        { key: "Violation", text: "Recent disqualifying violation" },
        { key: "Refusal to sign", text: "Declined to sign agreement form" },
        { key: "Other", text: "Other" },
      ],
      denialText: "Submit correction",
      deniedTabTitle: "Marked Incorrect",
      displayName: "Drug Transition Program Release",
      dynamicEligibilityText:
        "inmate[|s] may be eligible for Drug Transition Program Release",
      eligibilityDateText: "DTP or Projected DTP",
      eligibleCriteriaCopy: [
        {
          key: "usAzEnrolledInOrMeetsMandatoryLiteracyDtp",
          text: "Enrolled in or meets functional literacy requirement",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
        },
        {
          key: "usAzOnlyDrugOffenseConvictions",
          text: "Serving sentence for only eligible drug offenses",
        },
        {
          key: "custodyLevelIsMinimumOrMedium",
          text: "Classified as Minimum or Medium security",
          tooltip:
            "Inmates must be classified by the department as minimum or medium custody as determined by an objective risk assessment.",
        },
        {
          key: "usAzNoDtpRemovalsFromSelfImprovementPrograms",
          text: "No removals from major self-improvement programs within 18 months",
        },
        {
          key: "usAzNoUnsatisfactoryProgramRatingsWithin3Months",
          text: "No unsatisfactory program ratings within 3 months",
        },
        {
          key: "usAzNoViolations",
          text: "No disqualifying major incarceration violations",
        },
        {
          key: "usAzNoIneligibleDtpOffenseConvictions",
          text: "No disqualifying convictions",
        },
        {
          key: "usAzIncarcerationWithin6MonthsOfAcisDtpDate",
          text: "Upcoming DTP date in ACIS{{#if acisDtpDate}}: {{date acisDtpDate}}{{/if}}",
        },
        {
          key: "usAzWithin7DaysOfRecidivizDtpDate",
          text: "Upcoming projected DTP date{{#if recidivizDtpDate}}: {{date recidivizDtpDate}}{{/if}}",
        },
        {
          key: "usAzIsUsCitizenOrLegalPermanentResident",
          text: "Meets citizenship / legal permanent resident requirements",
        },
        {
          key: "usAzNoActiveFelonyDetainers",
          text: "No active felony detainers or warrants",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_AZ-DTPReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [
        {
          key: "usAzIncarcerationPastAcisDtpDate",
          text: "Upcoming DTP date in ACIS{{#if acisDtpDate}}: {{date acisDtpDate}}{{/if}}",
        },
        {
          key: "usAzEnrolledInOrMeetsMandatoryLiteracyDtp",
          text: "Has not enrolled in or met functional literacy requirement",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
        },
        {
          key: "custodyLevelIsMinimumOrMedium",
          text: "Not currently classified as Minimum or Medium Custody",
          tooltip:
            "Inmates must be currently classified by the department as minimum or medium custody as determined by an objective risk assessment.",
        },
        {
          key: "usAzNoViolations",
          text: "Has one or more major incarceration violations preventing eligibility",
          tooltip:
            "Inmates must have no major violent violations and no nonviolent violations within the last 6 months.",
        },
        {
          key: "usAzNoDtpRemovalsFromSelfImprovementPrograms",
          text: "Has been removed from a Self Improvement Program during the current incarceration",
        },
        {
          key: "usAzWithin7DaysOfRecidivizDtpDate",
          text: "Upcoming projected DTP date{{#if recidivizDtpDate}}: {{date recidivizDtpDate}}{{/if}}",
        },
        {
          key: "usAzIsUsCitizenOrLegalPermanentResident",
          text: "Does not meet citizenship / legal permanent resident requirements",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [
        {
          tab: "Fast Trackers",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
        {
          tab: "Eligible Now",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
        {
          tab: "Pending",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
        {
          tab: "Almost Eligible",
          texts: ["HOME_PLAN_IN_PROGRESS", "AWAITING_HOME_PLAN_APPROVAL"],
        },
        {
          tab: "Marked Incorrect",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
      ],
      methodologyUrl:
        "https://drive.google.com/file/d/13sj_5uRGKNEw1J9O-E3h-ohivKyv2k2k/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Requirements validated by ACIS",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsAzDates", "CaseNotes", "Incarceration"],
      snooze: { defaultSnoozeDays: 15, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AZ",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [
        { subcategory: "HOME_PLAN_IN_PROGRESS", text: "Home Plan in Progress" },
        {
          subcategory: "AWAITING_HOME_PLAN_APPROVAL",
          text: "Awaiting Home Plan Approval",
        },
        { subcategory: "AWAITING_RELEASE", text: "Awaiting Release" },
        {
          subcategory: "PROJECTED_TPR_IN_LESS_THAN_180_DAYS",
          text: "Projected DTP date in the next 6 months",
        },
        {
          subcategory: "PROJECTED_TPR_IN_AT_LEAST_180_DAYS",
          text: "Projected DTP date in 180 days or more",
        },
      ],
      subcategoryOrderings: [
        {
          tab: "Pending",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
        {
          tab: "Almost Eligible",
          texts: [
            "PROJECTED_TPR_IN_LESS_THAN_180_DAYS",
            "PROJECTED_TPR_IN_AT_LEAST_180_DAYS",
          ],
        },
      ],
      subheading:
        "This tool helps staff prioritize inmates for early release through the Drug Transition Program. Eligible individuals—or those nearing eligibility—will appear under designated tabs. [Learn more](https://docs.google.com/document/d/e/2PACX-1vTUcDC7U_T-u1vch4wQNB8POs1-TJhaUFodbv0srptCdQzHX7yRItEOYzlSyY2CNu8eDIlWibGeFvY-/pub)",
      submittedTabTitle: "Pending",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Almost Eligible",
            "Fast Trackers",
            "Eligible Now",
            "Overdue",
            "Pending",
            "Marked Incorrect",
          ],
        },
      ],
      tabPrefaceCopy: [
        {
          tab: "Fast Trackers",
          text: "Fast Tracker cases have a release date within 30 days, with dates already approved by Central Time Comp. COIIIs should ensure home plans are submitted and release packets are complete. Names are ordered by release date.",
        },
        {
          tab: "Eligible Now",
          text: "This tab lists cases with release dates 30–180 days out, approved by Central Time Comp. COIIIs must submit home plans for approval and complete all release packet components. Names are ordered by release date.",
        },
        {
          tab: "Almost Eligible",
          text: "This tab shows cases with projected release dates not yet approved by Central Time Comp. The first section includes inmates with a project release date within the next six months. The second section covers those 180+ days out. Use this tab to prioritize release planning. Names are ordered by release date.",
        },
        {
          tab: "Pending",
          text: "This tab shows inmates whose status was updated in this tool. Status updates do not write back to ACIS.",
        },
        {
          tab: "Marked Incorrect",
          text: "This tab shows inmates whose status was updated in this tool. Status updates do not write back to ACIS.",
        },
      ],
      tooltipEligibilityText: null,
      urlSection: "DTP",
      zeroGrantsTooltip: null,
    },
    usAzReleaseToTPR: {
      callToAction: "",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "Detainer", text: "Active felony detainer" },
        { key: "Intake", text: "Currently in intake and assessment" },
        { key: "Conviction", text: "Prior disqualifying conviction" },
        {
          key: "Misconduct involving weapons",
          text: "Misconduct Involving Weapons conviction: requires Time Comp review",
        },
        { key: "Violation", text: "Recent disqualifying violation" },
        { key: "Refusal to sign", text: "Declined to sign agreement form" },
        { key: "Other", text: "Other" },
      ],
      denialText: "Submit Correction",
      deniedTabTitle: "Marked Incorrect",
      displayName: "Standard Transition Program Release",
      dynamicEligibilityText:
        "inmate[|s] may be eligible for Standard Transition Program Release",
      eligibilityDateText: "TPR or Projected TPR",
      eligibleCriteriaCopy: [
        {
          key: "usAzEnrolledInOrMeetsMandatoryLiteracyTpr",
          text: "Functional literacy complete",
          tooltip:
            "Inmates must meet literacy standards, as required by A.R.S. §31-229.02. ",
        },
        {
          key: "custodyLevelIsMinimumOrMedium",
          text: "Classified as Minimum or Medium security",
          tooltip:
            "Inmates must be classified by the department as minimum or medium custody as determined by an objective risk assessment.",
        },
        {
          key: "usAzAtLeast24MonthsSinceLastCsed",
          text: "At least 24 months since last CSED",
        },
        {
          key: "usAzNoTprRemovalsFromSelfImprovementPrograms",
          text: "No removals from major self-improvement programs within 18 months",
        },
        {
          key: "usAzNoUnsatisfactoryProgramRatingsWithin3Months",
          text: "No unsatisfactory program ratings within 3 months",
        },
        {
          key: "usAzNoViolations",
          text: "No disqualifying major incarceration violations",
          tooltip: "",
        },
        {
          key: "usAzNoIneligibleTprOffenseConvictions",
          text: "No disqualifying convictions",
        },
        {
          key: "usAzIncarcerationWithin6MonthsOfAcisTprDate",
          text: "Upcoming TPR date in ACIS{{#if acisTprDate}}: {{date acisTprDate}}{{/if}}",
        },
        {
          key: "usAzWithin7DaysOfRecidivizTprDate",
          text: "Upcoming projected TPR date{{#if recidivizTprDate}}: {{date recidivizTprDate}}{{/if}}",
        },
        {
          key: "usAzIsUsCitizenOrLegalPermanentResident",
          text: "Meets citizenship / legal permanent resident requirements",
        },
        {
          key: "usAzNoActiveFelonyDetainers",
          text: "No active felony detainers or warrants",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_AZ-TPRReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "usAzIncarcerationPastAcisTprDate",
          text: "Upcoming TPR date in ACIS{{#if acisTprDate}}: {{date acisTprDate}}{{/if}}",
        },
        {
          key: "usAzEnrolledInOrMeetsMandatoryLiteracyTpr",
          text: "Functional literacy outstanding",
          tooltip:
            "Inmates must meet literacy standards, as required by A.R.S. §31-229.02. ",
        },
        {
          key: "custodyLevelIsMinimumOrMedium",
          text: "Not currently classified as Minimum or Medium Custody",
          tooltip:
            "Inmates must be currently classified by the department as minimum or medium custody as determined by an objective risk assessment.",
        },
        {
          key: "usAzNoViolations",
          text: "Has one or more major incarceration violations preventing eligibility",
          tooltip:
            "Inmates must have no major violent violations and no nonviolent violations within the last 6 months.",
        },
        {
          key: "usAzNoTprRemovalsFromSelfImprovementPrograms",
          text: "Has been removed from a Self Improvement Program during the current incarceration",
        },
        {
          key: "usAzWithin7DaysOfRecidivizTprDate",
          text: "Upcoming projected TPR date{{#if recidivizTprDate}}: {{date recidivizTprDate}}{{/if}}",
        },
        {
          key: "usAzIsUsCitizenOrLegalPermanentResident",
          text: "Does not meet citizenship / legal permanent resident requirements",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [
        {
          tab: "Fast Trackers",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
        {
          tab: "Eligible Now",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
        {
          tab: "Pending",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
        {
          tab: "Almost Eligible",
          texts: ["HOME_PLAN_IN_PROGRESS", "AWAITING_HOME_PLAN_APPROVAL"],
        },
        {
          tab: "Marked Incorrect",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
      ],
      methodologyUrl:
        "https://drive.google.com/file/d/13sj_5uRGKNEw1J9O-E3h-ohivKyv2k2k/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Requirements validated by ACIS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsAzDates", "CaseNotes", "Incarceration"],
      snooze: { defaultSnoozeDays: 15, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AZ",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [
        { subcategory: "HOME_PLAN_IN_PROGRESS", text: "Home Plan in Progress" },
        {
          subcategory: "AWAITING_HOME_PLAN_APPROVAL",
          text: "Awaiting Home Plan Approval",
        },
        { subcategory: "AWAITING_RELEASE", text: "Awaiting Release" },
        {
          subcategory: "PROJECTED_TPR_IN_LESS_THAN_180_DAYS",
          text: "Projected TPR date in the next 6 months",
        },
        {
          subcategory: "PROJECTED_TPR_IN_AT_LEAST_180_DAYS",
          text: "Projected TPR date in 180 days or more",
        },
      ],
      subcategoryOrderings: [
        {
          tab: "Pending",
          texts: [
            "HOME_PLAN_IN_PROGRESS",
            "AWAITING_HOME_PLAN_APPROVAL",
            "AWAITING_RELEASE",
          ],
        },
        {
          tab: "Almost Eligible",
          texts: [
            "PROJECTED_TPR_IN_LESS_THAN_180_DAYS",
            "PROJECTED_TPR_IN_AT_LEAST_180_DAYS",
          ],
        },
      ],
      subheading:
        "This tool helps staff prioritize inmates for early release through the Standard Transition Program. Eligible individuals—or those nearing eligibility—will appear under designated tabs. [Learn more](https://docs.google.com/document/d/e/2PACX-1vTUcDC7U_T-u1vch4wQNB8POs1-TJhaUFodbv0srptCdQzHX7yRItEOYzlSyY2CNu8eDIlWibGeFvY-/pub)",
      submittedTabTitle: "Pending",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Almost Eligible",
            "Fast Trackers",
            "Eligible Now",
            "Overdue",
            "Pending",
            "Marked Incorrect",
          ],
        },
      ],
      tabPrefaceCopy: [
        {
          tab: "Fast Trackers",
          text: "Fast Tracker cases have a release date within 30 days, with dates already approved by Central Time Comp. COIIIs should ensure home plans are submitted and release packets are complete. Names are ordered by release date. ",
        },
        {
          tab: "Eligible Now",
          text: "This tab lists cases with release dates 30–180 days out, approved by Central Time Comp. COIIIs must submit home plans for approval and complete all release packet components. Names are ordered by release date.",
        },
        {
          tab: "Almost Eligible",
          text: "This tab shows cases with projected release dates not yet approved by Central Time Comp. The first section includes inmates with a project release date within the next six months. The second section covers those 180+ days out. Use this tab to prioritize release planning. Names are ordered by release date.",
        },
        {
          tab: "Pending",
          text: "This tab shows inmates whose status was updated in this tool. Status updates do not write back to ACIS.",
        },
        {
          tab: "Marked Incorrect",
          text: "This tab shows inmates whose status was updated in this tool. Status updates do not write back to ACIS.",
        },
      ],
      tooltipEligibilityText: null,
      urlSection: "TPR",
      zeroGrantsTooltip: null,
    },
    usAzTransferToAdministrativeSupervision: {
      callToAction: "",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "INELIGIBLE_OFFENSES",
          text: "Current or prior conviction for an ineligible offense",
        },
        {
          key: "INITIAL_INTAKE",
          text: "Has not yet completed initial intake and needs assessment",
        },
        {
          key: "EMPLOYMENT",
          text: "Not currently employed, disabled, retired, or in school",
        },
        {
          key: "SUBSTANCE",
          text: "Currently dealing with substance use issues",
        },
        { key: "Other", text: "Other" },
      ],
      denialText: "Mark Ineligible",
      deniedTabTitle: "Marked Ineligible",
      displayName: "Administrative Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for Administrative Supervision.",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usAzAnyRiskScoreBut15MonthsViolationFree",
          text: '{{#if \n    (or\n      (or\n        (or\n            (eq orasAssessmentLevel "LOW" )\n            (eq orasAssessmentLevel "MODERATE" )\n        )\n        (eq orasAssessmentLevel "LOW_MODERATE" )\n      )\n      (eq intakeAssessmentLevel "MINIMUM" )\n    )\n}}\nEligible risk score\n{{else}}\nOn supervision 15 months violation free despite risk score\n{{/if}}\n\n',
          tooltip:
            '{{#if \n    (or\n      (or\n        (or\n            (eq orasAssessmentLevel "LOW" )\n            (eq orasAssessmentLevel "MODERATE" )\n        )\n        (eq orasAssessmentLevel "LOW_MODERATE" )\n      )\n      (eq intakeAssessmentLevel "MINIMUM" )\n    )\n}}\n(DO 1007 8.1.1 - 8.1.1.1) Risk and needs assessment shows a risk determination of moderate or lower. Clients that score Minimum on the Initial Community Risk Assessment and who therefore do not receive additional risk and needs assessment are not required to meet criteria 8.1.1 above.\n{{else}}\n(DO 1007 8.1.9) Clients with any risk score or offenses are eligible for administrative supervision if they meet the other criteria and have completed 15 consecutive months of supervision with no formal sanctions or interventions and the supervisor approves the placement on administrative supervision. See DO for more detail. \n{{/if}}',
        },
        {
          key: "usAzIneligibleOffensesBut15MonthsViolationFree",
          text: "{{#if \n  (and\n    (eq ineligibleConvictions null )\n    (eq ineligibleOffenses null )\n)\n}}\nNo current or prior convictions of exclusionary offenses\n{{else}}\nOn supervision 15 months violation free despite offenses/convictions \n{{/if}}\n\n",
          tooltip:
            "{{#if \n  (and\n    (eq ineligibleConvictions null )\n    (eq ineligibleOffenses null )\n)\n}}\n(DO 1007 8.1.2) No current or prior convictions of a registerable sexual offense or felony domestic violence offense, or current convictions of felony arson or murder, unless the client qualifies for administrative supervision under Section 8.1.9. See  Attachment A of DO 1007 for a list of offenses excluded under this section.\n{{else}}\n(DO 1007 8.1.9) Clients with any risk score or offenses are eligible for administrative supervision if they meet the other criteria and have completed 15 consecutive months of supervision with no formal sanctions or interventions and the supervisor approves the placement on administrative supervision. See DO for more detail. \n{{/if}}",
        },
        {
          key: "usAzRiskReleaseAssessmentIsCompleted",
          text: "Initial intake and needs assessment complete",
          tooltip:
            "(DO 1007 8.1.3) Has completed initial intake and risk and needs assessment with assigned CRO. This may be done in-person, or, where deemed appropriate by the CRO, virtually (e.g., by telephone or video call).",
        },
        {
          key: "usAzOrasEmployedDisabledRetiredOrStudent",
          text: "Currently employed, disabled, retired, or in school",
          tooltip:
            "(DO 1007 8.1.5) Currently employed, disabled, retired, or in school, as assessed in the risk and needs assessment. See DO for more details. ",
        },
        {
          key: "usAzMentalHealthScore3OrBelow",
          text: "Mental Health Score of 3 or below",
          tooltip: "(DO 1007 8.1.6) Mental Health Score below 4.",
        },
        {
          key: "usAzNotSeverelyMentallyIll",
          text: "Not SMI-C",
          tooltip: "(DO 1007 8.1.7) Not SMI-C.",
        },
        {
          key: "usAzOrasHasSubstanceUseIssues",
          text: "Not currently dealing with substance use issues",
          tooltip:
            "(DO 1007 8.1.8) Not currently dealing with substance use issues, as assessed in the risk and needs assessment. Only a score of 2, indicating “current problems caused by drug use,” disqualifies someone from eligibility. A client may also meet this requirement if they have abstained from illicit drug use for the past year.",
        },
      ],
      emptyTabCopy: [
        {
          tab: "Eligible per ORAS",
          text: "At this time, there are no clients who are currently eligible. Please navigate to one of the other tabs.",
        },
        {
          tab: "Eligible per Initial Assessment",
          text: "At this time, there are no clients who are almost eligible. Please navigate to one of the other tabs.",
        },
        {
          tab: "Transferred in ACIS",
          text: "No clients for the selected officer(s) were marked as transferred within the last day. Clients stop appearing in this tab 24 hours after the change is confirmed in ACIS.",
        },
        {
          tab: "Marked Ineligible",
          text: "At this time, there are no clients who are marked ineligible. Please navigate to one of the other tabs.",
        },
      ],
      firestoreCollection: "US_AZ-TransferToAdminSupervision",
      hideDenialRevert: true,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 5,
      ineligibleCriteriaCopy: [
        {
          key: "usAzDummyCopyToEnableAE",
          text: "This ineligible criteria is added to set opportunityConfiguration.supportsAlmostEligible as true",
        },
      ],
      initialHeader:
        "View low-needs clients who qualify for transfer to Administrative Supervision.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1U_V_4Xgj3rIWAFjLSbta-MojehPSU-YE/view?usp=drive_link",
      nonOmsCriteria: [
        {
          text: "Requires validation of DO 1007 section 8.1.4: A client has achieved stable housing while on supervision",
          tooltip:
            "See DO 1007 section 8.1.4 for details on what qualifies as stable housing.",
        },
        {
          text: "{{#if record.metadata.isMaybeEligible}}Requires validation of DO 1007 section 8.1.5: Currently employed, disabled, retired, or in school, as assessed in ORAS question 2.4{{/if}}",
          tooltip:
            "Alternate Eligibility: An offender may also meet this requirement by presenting their CRO with proof of gainful employment, enrollment in education, disability status, or retirement. For the purpose of this policy, people providing caregiving for a family member may also be considered to meet this condition. ",
        },
        {
          text: "{{#if record.metadata.isMaybeEligible}}Requires validation of DO 1007 section 8.1.8: Not currently dealing with substance uses issues, as assessed in ORAS question 5.4 {{/if}}",
          tooltip:
            "Alternate Eligibility: An offender may also meet this requirement if they have abstained from illicit drug use for the past year.",
        },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by data from ACIS",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Supervision"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AZ",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Identify clients who are eligible for Administrative Supervision and adjust their supervision level in ACIS. [Learn More](https://docs.google.com/document/d/e/2PACX-1vQ55ljjO7rz-6UiHGLwEcH7WR6_ZZIbEynN-92kO5D61wfKIZZVewqLxQdQfjOtv6vnKDSmQKLX9xui/pub)",
      submittedTabTitle: "Transferred in ACIS",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Eligible per ORAS",
            "Eligible per Initial Assessment",
            "Transferred in ACIS",
            "Marked Ineligible",
          ],
        },
      ],
      tabPrefaceCopy: [
        {
          tab: "Eligible per ORAS",
          text: "Clients in this tab have an ORAS score. Based on ORAS results and ACIS data, they appear eligible for Administrative Supervision. Review housing stability and transfer eligible clients to Administrative Supervision per policy.",
        },
        {
          tab: "Eligible per Initial Assessment",
          text: "These clients scored Low on the Initial Risk Assessment (no ORAS needed). Verify all items under “Requirements to Check” (shown when you click on the individual client). If all criteria are met, complete the transfer per policy.",
        },
        {
          tab: "Transferred in ACIS",
          text: "Clients appear here after you confirm that their supervision level has been set to Administrative Supervision in ACIS. Clients who were successfully transferred will drop off this list after 24 hours. If a client continues to appear here, double check their supervision level in ACIS.",
        },
        {
          tab: "Marked Ineligible",
          text: "This tab shows clients whose status was updated in this tool. Status updates do not write back to ACIS. ",
        },
      ],
      tooltipEligibilityText: null,
      urlSection: "AdminSupervision",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
