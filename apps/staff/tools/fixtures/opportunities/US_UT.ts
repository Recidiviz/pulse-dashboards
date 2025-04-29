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
    usUtEarlyTermination: {
      callToAction:
        "Review the clients and submit a report for those who are strong candidates",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "CRIMINAL CONDUCT",
          text: "Client engaged in new criminal conduct",
        },
        {
          key: "RESTITUTION",
          text: "Restitution, fines or fees haven't been paid consistently",
        },
        {
          key: "CASE ACTION PLAN",
          text: "Insufficient progress in the Case Action Plan",
        },
        {
          key: "TREATMENT",
          text: "Has not completed treatment or programming",
        },
        { key: "POLYGRAPH", text: "Exit polygraph required and outstanding" },
        { key: "Other", text: "Other, please enter a reason" },
      ],
      denialText: null,
      deniedTabTitle: "Marked Ineligible",
      displayName: "Early Termination of Supervision",
      dynamicEligibilityText:
        "client[|s] may be [a suitable candidate|suitable candidates] for Early Termination",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usUtHasCompletedOrderedAssessments",
          text: "Treatment completed",
          tooltip:
            "SENTENCING COMMISSION GUIDELINE: Completion of ordered assessments and any recommended treatment or programming by a licensed provider. For the purposes of this section, persons voluntarily engaged in ongoing care after having completing ordered treatment\nshall be considered as having completed treatment. If no treatment is ordered, then this requirement has been met.",
        },
        {
          key: "usUtRiskReductionForEt",
          text: "Decline in risk score",
          tooltip:
            "SENTENCING COMMISSION GUIDELINE: Risk reduction as indicated by ANY of the following:\n1. Overall reduction of 5 percent or more on LS/RNR or other validated risk assessment.\n2. Reduction by one level on LS/RNR or other validated risk assessment (e.g., high to moderate).\n3. Maintaining an overall risk level of moderate or low on LS/RNR or other validated risk assessment.",
        },
        {
          key: "supervisionHousingIsPermanentOrTemporaryFor3Months",
          text: "Past early termination review date (half-time date)",
          tooltip:
            "UDC BENCHMARK: A person under supervision is eligible for early termination at the early termination review date if the risk reduction, treatment completion and compliance and stability requirements are met. However, Adult Probation and Parole or the relevant supervising authority may submit for termination of supervision at any time, even if it is before the early termination review date indicated in the guidelines. The Court or the Board of Pardons and Parole may set individual criteria for a termination that is earlier than the guidelines at the time of probation sentencing or granting of parole. ",
        },
        {
          key: "supervisionHousingIsPermanentFor3Months",
          text: "Stable housing",
          tooltip:
            "UDC BENCHMARK: Client has had stable housing for at least three months. ",
        },
        {
          key: "supervisionContinuousEmploymentFor3Months",
          text: "Stable employment",
          tooltip:
            "UDC BENCHMARK: Client has had continuous employment for at least three months",
        },
        {
          key: "usUtNoMedhighSupervisionViolationWithin3Months",
          text: "No recent violation history",
          tooltip:
            "UDC BENCHMARK: Client has had no medium/high supervision violations in the last three months.",
        },
        {
          key: "onSupervisionAtLeast6Months",
          text: "On supervision for at least 6 months",
          tooltip: "UDC BENCHMARK",
        },
        {
          key: "usUtNoRiskLevelIncreaseOf15Percent",
          text: "No recent increase in risk score",
          tooltip:
            "UDC BENCHMARK: Risk score has not increased in more than 15% in the past year",
        },
        {
          key: "atLeast3MonthsSinceMostRecentPositiveDrugTest",
          text: "No recent positive drug test",
          tooltip: "UDC BENCHMARK: No positive drug test in the past 3 months",
        },
        {
          key: "supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
          text: "Is past early termination review date (half-time date)",
          tooltip:
            "UDC BENCHMARK: A person under supervision is eligible for early termination at the early termination review date if the risk reduction, treatment completion and compliance and stability requirements are met. However, Adult Probation and Parole or the relevant supervising authority may submit for termination of supervision at any time, even if it is before the early termination review date indicated in the guidelines. The Court or the Board of Pardons and Parole may set individual criteria for a termination that is earlier than the guidelines at the time of probation sentencing or granting of parole. ",
        },
        {
          key: "usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
          text: "Is past early termination review date (half-time date)",
          tooltip:
            "UDC BENCHMARK: A person under supervision is eligible for early termination at the early termination review date if the risk reduction, treatment completion and compliance and stability requirements are met. However, Adult Probation and Parole or the relevant supervising authority may submit for termination of supervision at any time, even if it is before the early termination review date indicated in the guidelines. The Court or the Board of Pardons and Parole may set individual criteria for a termination that is earlier than the guidelines at the time of probation sentencing or granting of parole. ",
        },
      ],
      emptyTabCopy: [
        {
          tab: "Report Due",
          text: "At this time, there are no clients who have a report due. Please navigate to one of the other tabs.",
        },
        {
          tab: "Report Submitted",
          text: "At this time, there are no clients who have a report submitted. Please navigate to one of the other tabs.",
        },
      ],
      firestoreCollection: "US_UT-earlyTerminationReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "usUtHasCompletedOrderedAssessments",
          text: "Has not yet completed ordered assessments, recommended treatment or programming ",
        },
        {
          key: "supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
          text: "Meets all criteria except for being past the early termination review date",
        },
        {
          key: "usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
          text: "Is not past early termination review date (half-time date)",
          tooltip:
            "A person under supervision is eligible for early termination at the early termination review date if the risk reduction, treatment completion and compliance and stability requirements are met. However, Adult Probation and Parole or the relevant supervising authority may submit for termination of supervision at any time, even if it is before the early termination review date indicated in the guidelines. The Court or the Board of Pardons and Parole may set individual criteria for a termination that is earlier than the guidelines at the time of probation sentencing or granting of parole. ",
        },
        {
          key: "supervisionContinuousEmploymentFor3Months",
          text: "Has not demonstrated employment stability ",
        },
      ],
      initialHeader:
        "Review the clients and submit a report to the court or BOPP for those who are strong candidates",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "https://dashboard.recidiviz.org",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by OTrack data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsUtDates", "Milestones", "Contact", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_UT",
      subcategoryHeadings: [
        { subcategory: "REPORT_DUE_ELIGIBLE", text: "Eligible" },
        { subcategory: "REPORT_DUE_ALMOST_ELIGIBLE", text: "Almost Eligible" },
      ],
      subcategoryOrderings: [
        {
          tab: "Report Due",
          texts: ["REPORT_DUE_ELIGIBLE", "REPORT_DUE_ALMOST_ELIGIBLE"],
        },
      ],
      subheading:
        "UDC Early Termination policy allows agents to apply to the courts or BOPP to end a client's probation or parole at the halfway mark or sooner. For clients who meet all of the criteria, reports must be filed with the court or Board 30 days before the early termination review date, or earlier at the agent’s discretion.",
      submittedTabTitle: "Report Submitted",
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Report Due",
            "Early Requests",
            "Report Submitted",
            "Marked Ineligible",
          ],
        },
      ],
      tabPrefaceCopy: [
        {
          tab: "Report Due",
          text: "This tab contains cases approaching or past their Early Termination Report Due Date that meet stability benchmarks set by UDC. It also contains cases that are missing one or two indicators of stability for Early Terminations.",
        },
        {
          tab: "Early Requests",
          text: "This tab contains cases not yet at their Early Termination Report Due Date that meet stability benchmarks set by UDC and are eligible for Early Termination consideration as per the Sentencing Guidelines.",
        },
        {
          tab: "Report Submitted",
          text: "This tab contains cases marked by the user as having a report submitted to the court or to the Board of Pardons and Parole.",
        },
        {
          tab: "Marked Ineligible",
          text: "This tab contains cases marked ineligible within this tool (status updates do not sync to OTrack).",
        },
      ],
      tooltipEligibilityText: null,
      urlSection: "EarlyTermination",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
