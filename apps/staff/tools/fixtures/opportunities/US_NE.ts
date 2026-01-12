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
    usNeConditionalLowRiskOverride: {
      callToAction:
        "Review clients who may be eligible for Conditional Low Risk and complete an override request",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "DETAINERS", text: "Pending charges or detainers in NCJIS" },
        { key: "COMPLIANCE", text: "Non-compliant with Case Plan" },
        { key: "VIOLENCE", text: "History of persistent violence" },
        {
          key: "MENTALHEALTH",
          text: "History of severe mental health disorders",
        },
        { key: "Other", text: "Other: Please specify reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Override to Conditional Low Risk",
      dynamicEligibilityText:
        "[client|clients] may be eligible for an override to Conditional Low Risk",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "onParoleAtLeast6Months",
          text: "Time on supervision: {{daysToYearsMonthsPast (daysPast opportunity.person.supervisionStartDate)}}",
        },
        {
          key: "onParoleAtLeastOneYear",
          text: "Time on supervision: {{daysToYearsMonthsPast (daysPast opportunity.person.supervisionStartDate)}}",
        },
        {
          key: "supervisionLevelIsMinimum",
          text: "Current supervision level: {{opportunity.person.supervisionLevel}}",
        },
        {
          key: "noSupervisionViolationWithin6Months",
          text: "No severe supervision violations in the last 6 months",
          tooltip:
            "The lowest severity violations (levels 1 and 2) do not disqualify someone for a CLR override",
        },
        {
          key: "noTopThreeSeverityLevelSupervisionViolationWithin6Months",
          text: "No severe supervision violations in the last 6 months",
          tooltip:
            "The lowest severity violations (levels 1 and 2) do not disqualify someone for a CLR override",
        },
        {
          key: "usNeCompliantWithSpecialConditions",
          text: "Compliant with applicable special conditions",
        },
        {
          key: "notSupervisionWithin1MonthOfProjectedCompletionDateMinExternal",
          text: "More than one month until Earned Discharge Date",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_NE-ConditionalLowRiskOverrideReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "TBD",
      nonOmsCriteria: [
        { text: "NCJIS check" },
        { text: "Compliance with Case Plan" },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by NICaMS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "EligibilityDate",
        "Supervision",
        "Contact",
        "CaseNotes",
        "ActiveSentences",
        "UsNeORASScores",
        "UsNeSpecialConditions",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_NE",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert surfaces people who may be appropriate for an override to Conditional Low Risk based on strong indicators of stability in the data. Consider supervision overrides to the current risk levels and contact standards on a case-by-case basis for clients meeting stability criteria.",
      submittedTabTitle: "Submitted",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "ConditionalLowRiskOverride",
      zeroGrantsTooltip: null,
    },
    usNeGoodTimeRestoration: {
      callToAction: "",
      caseNotesTitle: "Relevant Case Notes",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "PROGRAMMING",
          text: "Has not accepted or participated in clinical programming recommendation ",
        },
        { key: "MR", text: "Has pending Misconduct Reports" },
        {
          key: "RESTORATION_DENIED",
          text: "Has recently (within 90 days) had a time restoration request denied",
        },
        { key: "LTRH", text: "Not assigned to LTRH in past 90 days" },
        { key: "CIRCUMSTANCES", text: "Has other exigent circumstances" },
        { key: "COURT_ORDER", text: "Is excluded via court order" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Good Time Restoration",
      dynamicEligibilityText:
        " [resident|residents] may be eligible for good time restoration",
      eligibilityDateText: "Eligible for Restoration Since",
      eligibleCriteriaCopy: [
        {
          key: "usNeHasLostRestorableGoodTime",
          text: "Currently has {{goodTimeLostDaysRestorable}} days lost restorable good time",
        },
        {
          key: "housingUnitTypeIsSolitaryConfinement",
          text: "Not in Restrictive Housing",
        },
        { key: "usNeNotInCustodyLevel1a", text: "Not in 1A Custody Level" },
        {
          key: "noHighestSeverityIncarcerationSanctionsWithin1Year",
          text: "Have not had a Class 1 MR in the past year",
        },
        {
          key: "incarceratedInStatePrisonAtLeast1Year",
          text: "Has consistently been in NCDS jurisdiction for the past 12 months",
        },
        {
          key: "usNeNoIdcMrsInPast6Months",
          text: "Free of all IDC misconduct reports for the past 6 months\n",
        },
        {
          key: "usNeLessThan3UdcMrsInPast6Months",
          text: "No more than two UDC misconduct reports for the past 6 months",
        },
        {
          key: "usNeOver4MonthsFromTrd",
          text: "Over 4 months away from their TRD",
        },
        {
          key: "usNeAtLeast2WeeksSinceLastGoodTimeRestoration",
          text: "At least 2 weeks since they last received good time back",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_NE-goodTimeRestorationReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [
        {
          key: "noHighestSeverityIncarcerationSanctionsWithin1Year",
          text: "Needs 1 Year without a Class 1 MR (latest was  {{daysToYearsMonthsPast (daysPast latestEventDate)}} ago)",
        },
        {
          key: "usNeNoIdcMrsInPast6Months",
          text: "Needs 6 months without an IDC misconduct report (latest was {{daysToYearsMonthsPast (daysPast latestIncidentDate)}} ago)",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "TBD",
      nonOmsCriteria: [
        {
          text: "Accepted and participated in clinical treatment and recommendations ",
        },
        {
          text: "Has not had a good time restoration requested denied in the past 90 days",
        },
        { text: "Not assigned to LTRH in past 90 days" },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by data from NICaMS",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["EligibilityDate", "Incarceration"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_NE",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: "These residents may be eligible for good time restoration.",
      submittedTabTitle: null,
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "goodTimeRestoration",
      zeroGrantsTooltip: null,
    },
    usNeOverrideModerateToLow: {
      callToAction:
        "Review clients who may be eligible for Low and complete an override request",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "DETAINERS", text: "Pending charges or detainers in NCJIS" },
        { key: "COMPLIANCE", text: "Non-compliant with Case Plan" },
        { key: "VIOLENCE", text: "History of persistent violence" },
        {
          key: "MENTALHEALTH",
          text: "History of severe mental health disorders",
        },
        { key: "Other", text: "Other: Please specify reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Override to Low",
      dynamicEligibilityText:
        "[client|clients] may be eligible for an override to Low",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "onParoleAtLeast6Months",
          text: "Time on supervision: {{daysToYearsMonthsPast (daysPast opportunity.person.supervisionStartDate)}}",
        },
        {
          key: "onParoleAtLeastOneYear",
          text: "Time on supervision: {{daysToYearsMonthsPast (daysPast opportunity.person.supervisionStartDate)}}",
        },
        {
          key: "supervisionLevelIsMedium",
          text: "Current supervision level: {{opportunity.person.supervisionLevel}}",
        },
        {
          key: "noTopThreeSeverityLevelSupervisionViolationWithin6Months",
          text: "No severe supervision violations in the last 6 months",
          tooltip:
            "The lowest severity violations (levels 1 and 2) do not disqualify someone for a Low override",
        },
        {
          key: "notSupervisionWithin1MonthOfProjectedCompletionDateMinExternal",
          text: "More than one month until Earned Discharge Date",
        },
        {
          key: "usNeCompliantWithSpecialConditions",
          text: "Compliant with applicable special conditions",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_NE-OverrideModerateToLowReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "TBD",
      nonOmsCriteria: [
        { text: "NCJIS Check" },
        { text: "Compliance with Case Plan" },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by NICaMS data",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "EligibilityDate",
        "Supervision",
        "Contact",
        "CaseNotes",
        "ActiveSentences",
        "UsNeORASScores",
        "UsNeSpecialConditions",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_NE",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert surfaces people who may be appropriate for an override to Low based on strong indicators of stability in the data. Consider supervision overrides to the current risk levels and contact standards on a case-by-case basis for clients meeting stability criteria.",
      submittedTabTitle: "Submitted",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "OverrideModerateToLow",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
