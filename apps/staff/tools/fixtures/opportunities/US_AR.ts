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
    usArInstitutionalWorkerStatus: {
      callToAction: "Review residents who may be eligible for 309",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Act 309",
      dynamicEligibilityText: "[resident|residents] may be eligible for 309",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "incarcerationWithin45MonthsOfParoleEligibilityDate",
          text: "Within 45 months of parole or transfer eligibility date",
          tooltip: null,
        },
        {
          key: "usArClassIOrEligibleForClassI309",
          text: "In Class I, or eligible for Class I status",
          tooltip: null,
        },
        {
          key: "usArEligibleCriminalHistory309",
          text: "Not convicted of kidnapping, a second or a subsequent offense of aggravated robbery, or criminal attempt to commit these offenses",
          tooltip: null,
        },
        {
          key: "notServingALifeSentence",
          text: "Not serving a life sentence",
          tooltip: null,
        },
        {
          key: "noIncarcerationSanctionsWithin90Days",
          text: "No sanctions incurred in past 90 days",
          tooltip: null,
        },
        {
          key: "incarceratedAtLeast6Months",
          text: "Incarcerated for at least 6 months",
          tooltip: null,
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_AR-InstitutionalWorkerStatusReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "TBD",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration"],
      snooze: null,
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AR",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for 309",
      urlSection: "institutionalWorkerStatus",
      zeroGrantsTooltip: null,
    },
    usArWorkRelease: {
      callToAction: "Review residents who may be eligible for Work Release",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Work Release",
      dynamicEligibilityText:
        "[resident|residents] may be eligible for Work Release",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usArClassIOrEligibleForClassIWorkRelease",
          text: "Class I, or eligible for Class I status",
          tooltip: null,
        },
        { key: "age21YearsOrOlder", text: "Age: 21 or older", tooltip: null },
        {
          key: "incarceratedAtLeast60Days",
          text: "Incarcerated for at least 60 days",
          tooltip: null,
        },
        {
          key: "incarcerationWithin42MonthsOfParoleEligibilityDate",
          text: "Within 42 months of parole or transfer eligibility date",
          tooltip: null,
        },
        {
          key: "notServingALifeSentence",
          text: "Not serving a life sentence",
          tooltip: null,
        },
        { key: "noEscapeViolations", text: "No escape history", tooltip: null },
        {
          key: "noHighestSeverityIncarcerationSanctionsWithin90Days",
          text: "No major sanctions in past 90 days",
          tooltip: null,
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_AR-WorkReleaseReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "TBD",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration"],
      snooze: null,
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_AR",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for Work Release",
      urlSection: "workRelease",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
