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
    usNeConditionalLowRiskOverride: {
      callToAction:
        "Review clients who may be eligible for Conditional Low Risk and complete an override request",
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
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert surfaces people who may be appropriate for an override to Conditional Low Risk based on strong indicators of stability in the data. Consider supervision overrides to the current risk levels and contact standards on a case-by-case basis for clients meeting stability criteria.",
      submittedTabTitle: "Submitted",
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "ConditionalLowRiskOverride",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
    usNeOverrideModerateToLow: {
      callToAction:
        "Review clients who may be eligible for Low and complete an override request",
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
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert surfaces people who may be appropriate for an override to Low based on strong indicators of stability in the data. Consider supervision overrides to the current risk levels and contact standards on a case-by-case basis for clients meeting stability criteria.",
      submittedTabTitle: "Submitted",
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "OverrideModerateToLow",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
