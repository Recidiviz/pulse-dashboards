// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
        "This tool helps staff prioritize inmates to prepare for release to the Drug Transition Program (release back to the community up to 90 days ahead of their earliest release date). People who have a release date approved by Central Time Comp will appear on this page if their approved release date has passed. Use this tool to identify and prioritize overdue cases.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Overdue for Drug Transition Program",
      dynamicEligibilityText: "resident[|s] are past their DTP date",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usAzIncarcerationPastAcisDtpDate",
          text: "Past DTP date in ACIS{{#if acisDtpDate}}: {{date acisDtpDate}}{{/if}}",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_AZ-OverdueForDTPReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: true,
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
      snooze: null,
      stateCode: "US_AZ",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [{ key: "ELIGIBILITY STATUS", tabs: ["Overdue"] }],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "OverdueForDTP",
      zeroGrantsTooltip: null,
    },
    usAzOverdueForACISTPR: {
      callToAction:
        "This tool helps staff prioritize inmates to prepare for release to the Standard Transition Program (release back to the community up to 90 days ahead of their earliest release date). People who have a release date approved by Central Time Comp will appear on this page if their approved release date has passed. Use this tool to identify and prioritize overdue cases.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Overdue for Standard Transition Program",
      dynamicEligibilityText:
        "resident[|s] may be past their Standard Transition Program date",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usAzIncarcerationPastAcisTprDate",
          text: "Past TPR date in ACIS{{#if acisTprDate}}: {{date acisTprDate}}{{/if}}",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_AZ-OverdueForTPRReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: true,
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
      snooze: null,
      stateCode: "US_AZ",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [{ key: "ELIGIBILITY STATUS", tabs: ["Overdue"] }],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "OverdueForTPR",
      zeroGrantsTooltip: null,
    },
    usAzReleaseToDTP: {
      callToAction:
        "This tool helps staff prioritize inmates to prepare for release to the Drug Transition Program (release back to the community up to 90 days ahead of their earliest release date). People who meet the criteria for Drug Transition Release, or who might soon meet the criteria, will appear under one of these tabs. Use this tool to identify cases that need a home plan or other components of the release packet and update their status in the tool so that Central Time Comp can approve the inmate for release.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Drug Transition Program Release",
      dynamicEligibilityText:
        "inmate[|s] may be eligible for Drug Transition Program Release",
      eligibilityDateText: null,
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
      homepagePosition: 4,
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
      snooze: null,
      stateCode: "US_AZ",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Fast Trackers",
            "Approved by Time Comp",
            "Almost Eligible",
            "Pending",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "DTP",
      zeroGrantsTooltip: null,
    },
    usAzReleaseToTPR: {
      callToAction:
        "This tool helps staff prioritize inmates to prepare for release to the Standard Transition Program (release back to the community up to 90 days ahead of their earliest release date). People who meet the criteria for Standard Transition Release, or who might soon meet the criteria, will appear under one of these tabs. Use this tool to identify cases that need a home plan or other components of the release packet and update their status in the tool so that Central Time Comp can approve the inmate for release.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Standard Transition Program Release",
      dynamicEligibilityText:
        "inmate[|s] may be eligible for Standard Transition Program Release",
      eligibilityDateText: null,
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
          tooltip: "",
        },
        {
          key: "usAzNoSexualArsonOrDangerousCrimesAgainstChildren",
          text: "Not convicted of an ineligible sexual crime, arson, or dangerous crimes against children",
          tooltip:
            "Inmates must not have been convicted of a sexual offense pursuant to title 13, chapter 14 or a violation of title 13, chapter 17.",
        },
        {
          key: "usAzNotServingIneligibleOffense",
          text: "Not convicted of an ineligible violent crime",
          tooltip:
            "Inmates must not have been convicted of a violent crime as defined in section 13-901.03, unless the inmate was convicted of assault, aggravated assault or robbery.",
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
      snooze: null,
      stateCode: "US_AZ",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Fast Trackers",
            "Approved by Time Comp",
            "Almost Eligible",
            "Pending",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "TPR",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
