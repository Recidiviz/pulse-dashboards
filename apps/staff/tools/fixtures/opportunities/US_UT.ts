// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
      caseNotesTitle: null,
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
          key: "DENIED",
          text: "Early termination request was denied by parole board or judge",
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
            "SENTENCING COMMISSION GUIDELINE: Completion of ordered assessments and any recommended treatment or programming by a licensed provider. For the purposes of this section, persons voluntarily engaged in ongoing care after having completing ordered treatment\nshall be considered as having completed treatment. If no treatment is ordered, then this requirement has been met.",
        },
        {
          key: "usUtRiskReductionForEt",
          text: "Decline in risk score during supervision term",
          tooltip:
            "SENTENCING COMMISSION GUIDELINE: Risk reduction as indicated by ANY of the following:\n1. Overall reduction of 5 percent or more on LS/RNR or other validated risk assessment.\n2. Reduction by one level on LS/RNR or other validated risk assessment (e.g., high to moderate).\n3. Maintaining an overall risk level of moderate or low on LS/RNR or other validated risk assessment.",
        },
        {
          key: "supervisionHousingIsPermanentFor3Months",
          text: "Stable housing",
          tooltip:
            "AP&P STABILITY BENCHMARK: Client has had stable housing for at least three months. ",
        },
        {
          key: "supervisionContinuousEmploymentFor3Months",
          text: "Stable employment",
          tooltip:
            "AP&P STABILITY BENCHMARK: Client has had continuous employment for at least three months.",
        },
        {
          key: "usUtNoMedhighSupervisionViolationWithin12Months",
          text: "No recent violation history",
          tooltip:
            "AP&P STABILITY BENCHMARK: Client has had no medium/high supervision violations in the last 12 months.",
        },
        {
          key: "onSupervisionAtLeast6Months",
          text: "On supervision for at least 6 months",
          tooltip:
            "AP&P STABILITY BENCHMARK: On supervision for at least 6 months",
        },
        {
          key: "usUtNoRiskLevelIncreaseOf5Percent",
          text: "No recent increase in risk score",
          tooltip:
            "AP&P STABILITY BENCHMARK: Risk score has not increased in more than 5% in the past year",
        },
        {
          key: "atLeast6MonthsSinceMostRecentPositiveDrugTest",
          text: "No recent positive drug test",
          tooltip:
            "AP&P STABILITY BENCHMARK: No positive drug test in the past 6 months",
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
          tab: "Suitable for Early Termination",
          text: "At this time, there are no clients who have a report due and early termination stability benchmarks met. Please navigate to one of the other tabs.",
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
          text: "Unable to auto-verify ordered assessment or treatment completion. Please confirm treatment status if applicable.",
          tooltip:
            "SENTENCING COMMISSION GUIDELINE: Completion of ordered assessments and any recommended treatment or programming by a licensed provider. For the purposes of this section, persons voluntarily engaged in ongoing care after having completing ordered treatment\nshall be considered as having completed treatment. If no treatment is ordered, then this requirement has been met.",
        },
        {
          key: "usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
          text: "Is not past early termination review date (half-time date)",
          tooltip:
            "SENTENCING COMMISSION GUIDELINE: A person under supervision is eligible for early termination at the early termination review date if the risk reduction, treatment completion and compliance and stability requirements are met. However, Adult Probation and Parole or the relevant supervising authority may submit for termination of supervision at any time, even if it is before the early termination review date indicated in the guidelines. The Court or the Board of Pardons and Parole may set individual criteria for a termination that is earlier than the guidelines at the time of probation sentencing or granting of parole. ",
        },
        {
          key: "supervisionHousingIsPermanentFor3Months",
          text: "Has not demonstrated housing stability or is not currently housed",
          tooltip:
            "AP&P STABILITY BENCHMARK: Client has had stable housing for at least three months.",
        },
        {
          key: "supervisionContinuousEmploymentFor3Months",
          text: "Unable to auto-verify continuous employment. Please confirm employment history if applicable.",
          tooltip:
            "AP&P STABILITY BENCHMARK: Client has had continuous employment for at least three months.",
        },
        {
          key: "atLeast6MonthsSinceMostRecentPositiveDrugTest",
          text: "Recent positive drug test",
          tooltip:
            "AP&P STABILITY BENCHMARK: No positive drug test in the past 6 months",
        },
        {
          key: "onSupervisionAtLeast6Months",
          text: "Has not been on supervision for at least 6 months",
          tooltip:
            "AP&P STABILITY BENCHMARK: Client has been on supervision for at least 6 months",
        },
        {
          key: "usUtNoRiskLevelIncreaseOf5Percent",
          text: "Recent increase in risk score",
          tooltip:
            "AP&P STABILITY BENCHMARK: Risk score has not increased in more than 5% in the past year",
        },
      ],
      initialHeader:
        "Review the clients and submit a report to the court or BOPP for those who are strong candidates",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "#",
      nonOmsCriteria: [
        {
          text: "{{#unless (or record.ineligibleCriteria.atLeast6MonthsSinceMostRecentPositiveDrugTest (eq record.ineligibleCriteria.atLeast6MonthsSinceMostRecentPositiveDrugTest null))}}If relevant, negative drug test within the last 6 months{{/unless}}",
        },
        { text: "Confirm that any required treatment has been completed" },
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
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [
        { subcategory: "REPORT_DUE", text: "Report Due" },
        { subcategory: "EARLY_REQUESTS", text: "Early Requests" },
      ],
      subcategoryOrderings: [
        {
          tab: "Suitable for Early Termination",
          texts: ["REPORT_DUE", "EARLY_REQUESTS"],
        },
      ],
      subheading:
        "The Utah Sentencing Commission’s 2025 Adult Sentencing, Release, & Supervision Guidelines establish criteria for early termination of probation and parole. The guidelines outline when agents should submit a recommendation to the Court or Board of Pardons and Parole (BOPP) to end supervision at the halfway point—or earlier. Reports must be submitted to the Court or BOPP at least 30 days before the early termination review date, or earlier at the agent’s discretion.",
      submittedTabTitle: null,
      supportsIneligible: false,
      supportsSubmitted: false,
      systemType: "SUPERVISION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Suitable for Early Termination",
            "Report Due (Other)",
            "Report Submitted",
            "Marked Ineligible",
          ],
        },
      ],
      tabPrefaceCopy: [
        {
          tab: "Suitable for Early Termination",
          text: "This tab lists all clients who meet the treatment and risk reduction guidelines as well as the stability benchmarks set by UDC. Clients approaching or past their early termination report due date are listed at the top, and clients earlier in their sentence who are still good candidates for early termination are listed below under “Early Requests”.",
        },
        {
          tab: "Report Due (Other)",
          text: "This tab lists clients approaching or past their early termination report due date who have met the treatment and risk reduction guidelines, but not the stability benchmarks.",
        },
        {
          tab: "Report Submitted",
          text: "This tab contains cases that have had a report submitted to the court or to the Board of Pardons and Parole within the past 4 months. ",
        },
        {
          tab: "Marked Ineligible",
          text: "This tab contains cases marked ineligible within this tool (status updates do not sync to O-Track).",
        },
      ],
      tooltipEligibilityText: null,
      urlSection: "EarlyTermination",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
