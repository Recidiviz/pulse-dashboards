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
    usAzOverdueForACISDTP: {
      callToAction:
        "This tool helps staff prioritize inmates for early release through the Drug Transition Program. Inmates with a release date in ACIS in the past will appear on this page. ",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "Detainer", text: "Active felony detainer" },
        { key: "Intake", text: "Currently in intake and assessment" },
        { key: "Conviction", text: "Prior disqualifying conviction" },
        { key: "Violation", text: "Recent disqualifying violation" },
        { key: "Refusal to sign", text: "Declined to sign agreement form" },
        { key: "Other", text: "Other" },
      ],
      denialText: "Mark as Incorrect",
      deniedTabTitle: null,
      displayName: "Overdue for Drug Transition Program",
      dynamicEligibilityText: "resident[|s] are past their DTP date",
      eligibilityDateText: "DTP date",
      eligibleCriteriaCopy: [
        {
          key: "usAzIncarcerationPastAcisDtpDate",
          text: "Past DTP date in ACIS{{#if acisDtpDate}}: {{date acisDtpDate}}{{/if}}",
        },
        {
          key: "usAzNoActiveFelonyDetainers",
          text: "No active felony detainers",
        },
        {
          key: "usAzEnrolledInOrMeetsMandatoryLiteracy",
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
          key: "usAzNoViolationsAndEligibleLegalStatus",
          text: "No disqualifying violations of major rules",
        },
        {
          key: "usAzNoIneligibleDtpOffenseConvictions",
          text: "No disqualifying convictions",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_AZ-OverdueForDTPReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: true,
      highlightedCaseCtaCopy: "overdue DTP cases",
      homepagePosition: 4,
      ineligibleCriteriaCopy: [
        {
          key: "usAzNoActiveFelonyDetainers",
          text: "Has one or more felony detainers",
        },
        {
          key: "usAzEnrolledInOrMeetsMandatoryLiteracy",
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
          key: "usAzNoViolationsAndEligibleLegalStatus",
          text: "Has one or more violations preventing eligibility",
          tooltip:
            "Inmates must have no major violent violations and no nonviolent violations within the last 6 months.",
        },
        {
          key: "usAzNoDtpRemovalsFromSelfImprovementPrograms",
          text: "Has been removed from a Self Improvement Program during the current incarceration",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/13sj_5uRGKNEw1J9O-E3h-ohivKyv2k2k/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Requirements validated by ACIS",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsAzDates", "CaseNotes", "Incarceration"],
      snooze: { defaultSnoozeDays: 4, maxSnoozeDays: 10 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AZ",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "INCARCERATION",
      tabGroups: [{ key: "ELIGIBILITY STATUS", tabs: ["Overdue"] }],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "OverdueForDTP",
      zeroGrantsTooltip: null,
    },
    usAzOverdueForACISTPR: {
      callToAction:
        "This tool helps staff prioritize inmates for early release through the Standard Transition Program. Inmates with a release date in ACIS in the past will appear on this page. ",
      compareBy: null,
      denialAdjective: "incorrect",
      denialNoun: null,
      denialReasons: [
        { key: "Detainer", text: "Active felony detainer" },
        { key: "Intake", text: "Currently in intake and assessment" },
        { key: "Conviction", text: "Prior disqualifying conviction" },
        { key: "Violation", text: "Recent disqualifying violation " },
        { key: "Refusal to sign", text: "Declined to sign agreement form" },
        { key: "Other", text: "Other" },
      ],
      denialText: "Mark as Incorrect",
      deniedTabTitle: "",
      displayName: "Overdue for Standard Transition Program",
      dynamicEligibilityText:
        "resident[|s] may be past their Standard Transition Program date",
      eligibilityDateText: "TPR date",
      eligibleCriteriaCopy: [
        {
          key: "usAzIncarcerationPastAcisTprDate",
          text: "Past TPR date in ACIS{{#if acisTprDate}}: {{date acisTprDate}}{{/if}}",
        },
        { key: "usAzNoActiveFelonyDetainers", text: "No felony detainers" },
        {
          key: "usAzMeetsFunctionalLiteracyTpr",
          text: "Functional literacy complete",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
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
          key: "usAzNoViolationsAndEligibleLegalStatus",
          text: "No disqualifying violations of major rules",
        },
        {
          key: "usAzNoIneligibleTprOffenseConvictions",
          text: "No disqualifying convictions",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_AZ-OverdueForTPRReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: true,
      highlightedCaseCtaCopy: "overdue STP cases",
      homepagePosition: 3,
      ineligibleCriteriaCopy: [
        {
          key: "usAzMeetsFunctionalLiteracyTpr",
          text: "Functional literacy outstanding",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
        },
        {
          key: "usAzNoActiveFelonyDetainers",
          text: "Has one or more felony detainers",
        },
        {
          key: "custodyLevelIsMinimumOrMedium",
          text: "Not currently classified as Minimum or Medium Custody",
          tooltip:
            "Inmates must be currently classified by the department as minimum or medium custody as determined by an objective risk assessment.",
        },
        {
          key: "usAzNoViolationsAndEligibleLegalStatus",
          text: "Has one or more violations preventing eligibility",
          tooltip:
            "Inmates must have no major violent violations and no nonviolent violations within the last 6 months.",
        },
        {
          key: "usAzNoTprRemovalsFromSelfImprovementPrograms",
          text: "Has been removed from a Self Improvement Program during the current incarceration",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/13sj_5uRGKNEw1J9O-E3h-ohivKyv2k2k/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsAzDates", "CaseNotes", "Incarceration"],
      snooze: { defaultSnoozeDays: 4, maxSnoozeDays: 10 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AZ",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "INCARCERATION",
      tabGroups: [{ key: "ELIGIBILITY STATUS", tabs: ["Overdue"] }],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "OverdueForTPR",
      zeroGrantsTooltip: null,
    },
    usAzReleaseToDTP: {
      callToAction:
        "This tool helps staff prioritize inmates for early release through the Drug Transition Program. Eligible individuals—or those nearing eligibility—will appear under designated tabs. ",
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
      deniedTabTitle: null,
      displayName: "Drug Transition Program Release",
      dynamicEligibilityText:
        "inmate[|s] may be eligible for Drug Transition Program Release",
      eligibilityDateText: "DTP or Projected DTP",
      eligibleCriteriaCopy: [
        {
          key: "usAzNoActiveFelonyDetainers",
          text: "No active felony detainers",
        },
        {
          key: "usAzEnrolledInOrMeetsMandatoryLiteracy",
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
          key: "usAzNoViolationsAndEligibleLegalStatus",
          text: "No disqualifying violations of major rules",
        },
        {
          key: "usAzNoIneligibleDtpOffenseConvictions",
          text: "No disqualifying convictions",
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
          key: "usAzNoActiveFelonyDetainers",
          text: "Has one or more felony detainers",
        },
        {
          key: "usAzEnrolledInOrMeetsMandatoryLiteracy",
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
          key: "usAzNoViolationsAndEligibleLegalStatus",
          text: "Has one or more violations preventing eligibility",
          tooltip:
            "Inmates must have no major violent violations and no nonviolent violations within the last 6 months.",
        },
        {
          key: "usAzNoDtpRemovalsFromSelfImprovementPrograms",
          text: "Has been removed from a Self Improvement Program during the current incarceration",
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
      ],
      methodologyUrl:
        "https://drive.google.com/file/d/13sj_5uRGKNEw1J9O-E3h-ohivKyv2k2k/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Requirements validated by ACIS",
      overdueOpportunityCalloutCopy: "overdue for their DTP date",
      priority: "NORMAL",
      sidebarComponents: ["UsAzDates", "CaseNotes", "Incarceration"],
      snooze: { defaultSnoozeDays: 15, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AZ",
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
      subheading: null,
      submittedTabTitle: "Pending",
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: ["Fast Trackers", "Eligible Now", "Almost Eligible", "Pending"],
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
      ],
      tooltipEligibilityText: null,
      urlSection: "DTP",
      zeroGrantsTooltip: null,
    },
    usAzReleaseToTPR: {
      callToAction:
        "This tool helps staff prioritize inmates for early release through the Standard Transition Program. Eligible individuals—or those nearing eligibility—will appear under designated tabs. ",
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
      deniedTabTitle: null,
      displayName: "Standard Transition Program Release",
      dynamicEligibilityText:
        "inmate[|s] may be eligible for Standard Transition Program Release",
      eligibilityDateText: "TPR or Projected TPR",
      eligibleCriteriaCopy: [
        { key: "usAzNoActiveFelonyDetainers", text: "No felony detainers" },
        {
          key: "usAzMeetsFunctionalLiteracyTpr",
          text: "Functional literacy complete",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
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
          key: "usAzNoViolationsAndEligibleLegalStatus",
          text: "No disqualifying violations of major rules",
          tooltip: "",
        },
        {
          key: "usAzNoIneligibleTprOffenseConvictions",
          text: "No disqualifying convictions",
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
          key: "usAzMeetsFunctionalLiteracyTpr",
          text: "Functional literacy outstanding",
          tooltip:
            "The inmate must not have failed to achieve functional literacy as required by section 41-1604.07, subsection F, unless the inmate is enrolled in a program that prepares the inmate to achieve functional literacy.",
        },
        {
          key: "usAzNoActiveFelonyDetainers",
          text: "Has one or more felony detainers",
        },
        {
          key: "custodyLevelIsMinimumOrMedium",
          text: "Not currently classified as Minimum or Medium Custody",
          tooltip:
            "Inmates must be currently classified by the department as minimum or medium custody as determined by an objective risk assessment.",
        },
        {
          key: "usAzNoViolationsAndEligibleLegalStatus",
          text: "Has one or more violations preventing eligibility",
          tooltip:
            "Inmates must have no major violent violations and no nonviolent violations within the last 6 months.",
        },
        {
          key: "usAzNoTprRemovalsFromSelfImprovementPrograms",
          text: "Has been removed from a Self Improvement Program during the current incarceration",
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
          tab: "Marked Ineligible",
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
      overdueOpportunityCalloutCopy: "overdue for their STP date",
      priority: "NORMAL",
      sidebarComponents: ["UsAzDates", "CaseNotes", "Incarceration"],
      snooze: { defaultSnoozeDays: 15, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AZ",
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
      subheading: null,
      submittedTabTitle: "Pending",
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Fast Trackers",
            "Eligible Now",
            "Almost Eligible",
            "Pending",
            "Marked Ineligible",
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
          tab: "Marked Ineligible",
          text: "This tab shows inmates whose status was updated in this tool. Status updates do not write back to ACIS.",
        },
      ],
      tooltipEligibilityText: null,
      urlSection: "TPR",
      zeroGrantsTooltip: null,
    },
    usAzTransferToAdministrativeSupervision: {
      callToAction:
        "Review clients who may be eligible for Administrative Supervision and complete the checklist for them.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "INELIGIBLE_OFFENSES",
          text: "Current conviction for an ineligible offense",
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
      denialText: "Mark ineligible",
      deniedTabTitle: "Marked Ineligible",
      displayName: "Administrative Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for transfer to Administrative Supervision.",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usAzEligibleRiskLevel",
          text: "ORAS risk determination of medium or lower",
          tooltip:
            "(1.1) ORAS risk determination of medium or lower, unless the client qualifies for administrative supervision under section 1.8.\n\n(1.1.1) Clients that score Minimum on the Initial Community Risk Assessment and who therefore do not receive the ORAS assessment are not required to meet criteria 1.1 above.",
        },
        {
          key: "usAzIneligibleOffensesBut15MonthsViolationFree",
          text: "No current convictions of sex offense, domestic violence, arson, or homicide",
          tooltip:
            "(1.2) No current convictions of sex offense, domestic violence, arson or homicide, unless the client qualifies for administrative supervision under section 1.8.",
        },
        {
          key: "usAzRiskReleaseAssessmentIsCompleted",
          text: "Initial intake and needs assessment complete",
          tooltip:
            "(1.3) Has completed initial intake and needs assessment with assigned CRO. This may be done in-person, or, where deemed appropriate by the CRO, virtually (eg. telephone or by video call).",
        },
        {
          key: "usAzNotHomelessInReleasePlan",
          text: "Not classified as homeless in home release plan",
          tooltip:
            "(1.4) Not classified as homeless in their home release plan. A client may also meet this requirement once they have achieved stable housing while on supervision.",
        },
        {
          key: "usAzOrasEmployedDisabledRetiredOrStudent",
          text: "Currently employed, disabled, retired, or in school",
          tooltip:
            "(1.5) Currently employed, disabled, retired, or in school, as assessed in ORAS question 2.4. A client may also meet this requirement by presenting their CRO with proof of gainful employment, enrollment in education, disability status, application for disability status, inability to work, or retirement. For the purpose of this policy, clients providing caregiving for a family member may also be considered to meet this condition.",
        },
        {
          key: "usAzMentalHealthScore3OrBelow",
          text: "Mental Health Score of 3 or below and not SMI-C",
          tooltip: "(1.6) Mental Health Score of 3 or below and not SMI-C.",
        },
        {
          key: "usAzOrasHasSubstanceUseIssues",
          text: "Not currently dealing with substance use issues",
          tooltip:
            "(1.7) Not currently dealing with substance use issues, as assessed in ORAS question 5.4. Only a score of 2, indicating “current problems caused by drug use,” disqualifies someone from this requirement. A client may also meet this requirement if they have abstained from illicit drug use for the past year.",
        },
      ],
      emptyTabCopy: [
        {
          tab: "Eligible Now",
          text: "At this time, there are no clients who are currently eligible. Please navigate to one of the other tabs.",
        },
        {
          tab: "Almost Eligible",
          text: "At this time, there are no clients who are almost eligible. Please navigate to one of the other tabs.",
        },
        {
          tab: "Marked Ineligible",
          text: "At this time, there are no clients who are marked ineligible. Please navigate to one of the other tabs.",
        },
      ],
      firestoreCollection: "US_AZ-TransferToAdminSupervision",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 5,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "View low-needs clients who qualify for transfer to Administrative Supervision.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1Z7heBZYSj9RuEa0o6q4gW12M7ej1Ak9b/view",
      nonOmsCriteria: [
        {
          text: "{{#if record.metadata_is_maybe_eligible_missing_1_4}}text to show if missing 1.4{{/if}}",
          tooltip: "hello",
        },
        {
          text: "{{#if record.metadata.metadata_is_maybe_eligible_missing_1_5}}text to show if missing 1.5{{/if}}",
          tooltip: "test 2",
        },
        {
          text: "{{#if record.metadata.metadata_is_maybe_eligible_missing_1_7}}text to show if missing 1.7{{/if}}",
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
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "AdminSupervision",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
