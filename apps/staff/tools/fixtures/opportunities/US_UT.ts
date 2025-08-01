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
        "Review the clients and submit a report for those who are good candidates for Early Termination.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "PENDING CHARGES", text: "Pending warrant or charges" },
        {
          key: "RESTITUTION",
          text: "Insufficient restitution, fines, or fees effort",
        },
        {
          key: "TREATMENT",
          text: "Has not completed treatment or programming",
        },
        { key: "HOUSING", text: "Unstable housing situation" },
        { key: "EMPLOYMENT", text: "Unstable employment situation" },
        {
          key: "SEX OFFENSE",
          text: "Has a sex offense charge inappropriate for early termination",
        },
        { key: "DRUG SCREEN", text: "No drug screen in the past six months" },
        { key: "ICOTS", text: "Interstate Compact (ICOTS) in" },
        { key: "OTHER", text: "Other" },
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
            "AP&P BENCHMARK: Completion of ordered assessments and any recommended treatment or programming by a licensed provider. For the purposes of this section, persons voluntarily engaged in ongoing care after having completing ordered treatment\nshall be considered as having completed treatment. If no treatment is ordered, then this requirement has been met.",
        },
        {
          key: "usUtRiskReductionForEt",
          text: "Decline in risk score",
          tooltip:
            "AP&P BENCHMARK: Risk reduction as indicated by ANY of the following:\n1. Overall reduction of 5 percent or more on LS/RNR or other validated risk assessment.\n2. Reduction by one level on LS/RNR or other validated risk assessment (e.g., high to moderate).\n3. Maintaining an overall risk level of moderate or low on LS/RNR or other validated risk assessment.",
        },
        {
          key: "supervisionHousingIsPermanentFor3Months",
          text: "Stable housing",
          tooltip:
            "AP&P BENCHMARK: Client has had stable housing for at least three months. ",
        },
        {
          key: "supervisionContinuousEmploymentFor3Months",
          text: "Stable employment",
          tooltip:
            "AP&P BENCHMARK: Client has had continuous employment for at least three months",
        },
        {
          key: "usUtNoMedhighSupervisionViolationWithin12Months",
          text: "No recent violation history",
          tooltip:
            "AP&P BENCHMARK: Client has had no medium/high supervision violations in the last 12 months.",
        },
        {
          key: "onSupervisionAtLeast6Months",
          text: "On supervision for at least 6 months",
          tooltip: "AP&P BENCHMARK: On supervision for at least 6 months",
        },
        {
          key: "usUtNoRiskLevelIncreaseOf5Percent",
          text: "No recent increase in risk score",
          tooltip:
            "AP&P BENCHMARK: Risk score has not increased in more than 5% in the past year",
        },
        {
          key: "atLeast6MonthsSinceMostRecentPositiveDrugTest",
          text: "No recent positive drug test",
          tooltip: "AP&P BENCHMARK: No positive drug test in the past 6 months",
        },
        {
          key: "usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
          text: "Is past early termination review date (half-time date)",
          tooltip:
            "SENTENCING COMMISSION GUIDELINE: A person under supervision is eligible for early termination at the early termination review date if the risk reduction, treatment completion and compliance and stability requirements are met. However, Adult Probation and Parole or the relevant supervising authority may submit for termination of supervision at any time, even if it is before the early termination review date indicated in the guidelines. The Court or the Board of Pardons and Parole may set individual criteria for a termination that is earlier than the guidelines at the time of probation sentencing or granting of parole. ",
        },
      ],
      emptyTabCopy: [
        {
          tab: "Report Due (Benchmarks Met)",
          text: "At this time, there are no clients who have a report due and benchmarks met. Please navigate to one of the other tabs.",
        },
        {
          tab: "Report Due (Other)",
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
          text: "Has not yet completed ordered assessments, recommended treatment or programming",
        },
        {
          key: "usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
          text: "Is not past early termination review date (half-time date)",
          tooltip:
            "A person under supervision is eligible for early termination at the early termination review date if the risk reduction, treatment completion and compliance and stability requirements are met. However, Adult Probation and Parole or the relevant supervising authority may submit for termination of supervision at any time, even if it is before the early termination review date indicated in the guidelines. The Court or the Board of Pardons and Parole may set individual criteria for a termination that is earlier than the guidelines at the time of probation sentencing or granting of parole. ",
        },
        {
          key: "supervisionHousingIsPermanentFor3Months",
          text: "Has not demonstrated housing stability or is not currently housed",
          tooltip:
            "AP&P BENCHMARK: Client has had stable housing for at least three months.",
        },
        {
          key: "supervisionContinuousEmploymentFor3Months",
          text: "Has not demonstrated employment stability or is not currently employed",
          tooltip:
            "AP&P BENCHMARK: Client has had continuous employment for at least three months",
        },
        {
          key: "atLeast6MonthsSinceMostRecentPositiveDrugTest",
          text: "Recent positive drug test",
          tooltip: "AP&P BENCHMARK: No positive drug test in the past 6 months",
        },
        {
          key: "onSupervisionAtLeast6Months",
          text: "Has not been on supervision for at least 6 months",
          tooltip: "AP&P BENCHMARK: On supervision for at least 6 months",
        },
      ],
      initialHeader:
        "Review the clients and submit a report to the court or BOPP for those who are strong candidates",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://docs.google.com/document/d/e/2PACX-1vR3uKKRbdWXDRUz8v1km5oZNNeYuB3yUmWsZLut8RlPCAQqjUi4Cle3fXeivhYKYm8By--6nNRWFIUO/pub",
      nonOmsCriteria: [
        {
          text: "{{#unless (or record.ineligibleCriteria.atLeast6MonthsSinceMostRecentPositiveDrugTest (eq record.ineligibleCriteria.atLeast6MonthsSinceMostRecentPositiveDrugTest null))}}If relevant, negative drug test within the last 6 months{{/unless}}",
        },
        {
          text: "{{#if (or record.ineligibleCriteria.usUtHasCompletedOrderedAssessments (eq record.ineligibleCriteria.usUtHasCompletedOrderedAssessments null))}}Confirm that clinical assessment confirmed need for treatment{{/if}}",
        },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by O-Track data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsUtDates", "Milestones", "Contact", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_UT",
      subcategoryHeadings: [
        { subcategory: "REPORT_DUE_ELIGIBLE", text: "All Benchmarks Met" },
        {
          subcategory: "REPORT_DUE_ALMOST_ELIGIBLE",
          text: "Almost All Benchmarks Met",
        },
      ],
      subcategoryOrderings: [
        {
          tab: "Report Due (Benchmarks Met)",
          texts: ["REPORT_DUE_ELIGIBLE", "REPORT_DUE_ALMOST_ELIGIBLE"],
        },
      ],
      subheading:
        "The Utah Sentencing Commission’s 2025 Adult Sentencing, Release, & Supervision Guidelines establish criteria for early termination of probation and parole. The guidelines outline when agents should submit a recommendation to the Court or Board of Pardons and Parole (BOPP) to end supervision at the halfway point—or earlier. For clients who meet all criteria, reports must be submitted to the Court or BOPP at least 30 days before the early termination review date, or earlier at the agent’s discretion.",
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "SUPERVISION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Report Due (Benchmarks Met)",
            "Report Due (Other)",
            "Early Requests",
            "Report Submitted",
            "Marked Ineligible",
          ],
        },
      ],
      tabPrefaceCopy: [
        {
          tab: "Report Due (Benchmarks Met)",
          text: "This tab contains eligible cases approaching or past their early termination report due date that meet stability benchmarks set by UDC. It also contains cases almost eligible that are missing one or two indicators of stability for Early Terminations.",
        },
        {
          tab: "Report Due (Other)",
          text: "This tab contains additional cases approaching or past their early termination report due date, even if they are missing one or two indicators of stability for Early Terminations.",
        },
        {
          tab: "Early Requests",
          text: "This tab contains cases not yet at their early termination report due date that meet stability benchmarks set by UDC and are eligible for Early Termination consideration as per the Sentencing Guidelines.",
        },
        {
          tab: "Report Submitted",
          text: "This tab contains cases that have had a report submitted to the court or to the Board of Pardons and Parole within the past 4 months.",
        },
        {
          tab: "Marked Ineligible",
          text: "This tab contains cases marked ineligible within this tool (status updates do not sync to O-Track).",
        },
      ],
      tooltipEligibilityText: null,
      urlSection: "EarlyTermination",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
