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
    usNcCreditReductionReview: {
      callToAction: null,
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "HAS_VIOLATION",
          text: "Has a violation that makes them ineligible for a Credit Review.",
        },
        {
          key: "INCORRECT_POSITIVE_BEHAVIOR",
          text: "Has not demonstrated 90 days of compliance with reintegrative conditions.",
        },
        {
          key: "NOT_REPORTING_AS_DIRECTED",
          text: "Has not reported as directed.",
        },
        { key: "OTHER", text: "Ineligible for another reason." },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Credit Review",
      dynamicEligibilityText: "clients may be eligible for a Credit Review",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usNc90ConsecutiveDaysOfPositiveBehaviorForCrr",
          text: '{{#if continuousEnrollmentAtFacilityFor90Days}}The following action step(s) have been ONGOING for 90+ days: {{#each facilityProgramId}}"{{titleCase this}}" (started: {{lookup ../facilityProgramStartDate @index}}){{#unless @last}}, {{/unless}}{{/each}}. {{/if}}{{#each employerName}}{{#if @last}}Employed consistently since {{lookup ../employmentStartDate 0}}, and currently employed with "{{titleCase this}}"{{/if}}. {{/each}}{{#if continuousStudentFor90Days}}Enrolled in an educational program since {{lookup studentStartDate 0}}. {{/if}}{{#if completionOfFacilityProgramDuringPrs}}Spent 90 days or more successfully completing the following programs: {{#each completedFacilityProgramIds}}"{{titleCase this}}" ({{lookup ../completedProgramStartDates @index}} to {{lookup ../completedProgramDischargeDates @index}}){{#unless @last}}, {{/unless}}{{/each}}.{{/if}}',
          tooltip:
            "90 consecutive days employed, actively enrolled in an education program, or at a facility or institution for medical or psychological treatment.\n\nIf you believe this is incorrect, please email feedback@recidiviz.org.",
        },
        {
          key: "usNcNoPendingViolationsOrConvictionsPrecludingCrr",
          text: "No pending violations or charges which would preclude the client from receiving a Credit Review. ",
          tooltip:
            "If you believe this is incorrect, please email feedback@recidiviz.org.",
        },
        {
          key: "usNcReportingAsDirected",
          text: "Client reports as directed.",
          tooltip:
            "If you believe this is incorrect, please email feedback@recidiviz.org.",
        },
        {
          key: "usNcCompletedSexOffenderTreatmentOrWithin30MonthsOfFullTermCompletionDate",
          text: "{{#if rawSexOffenseCaseTypes}}{{#if dischargeDates}}Completed sex offender treatment on {{#each dischargeDates}}{{#if @last}}{{this}}.{{/if}}{{/each}}{{else}}Does not have sex offender treatment assigned.\n{{/if}}{{/if}}",
          tooltip:
            "If someone is convicted of a sex offense, they must have completed their training, or they must not have training assigned and have less than 30 months remaining on their sentence.\n\nIf you believe this is incorrect, please email feedback@recidiviz.org.",
        },
        {
          key: "drugScreenOkForCrr",
          text: "{{#if atLeast30DaysSinceDrugScreen}}Last drug test was within 30 days ({{latestDrugScreenDate}}) and was negative.{{/if}}",
          tooltip:
            "If you believe this person's most recent drug test was negative and within 30 days, please email feedback@recidiviz.org.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_NC-creditReductionReview",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "usNc90ConsecutiveDaysOfPositiveBehaviorForCrr",
          text: 'This person will have demonstrated 90 days of positive behavior on {{eligibleDate}}. {{#if facilityProgramId}} They have been pursuing {{#each facilityProgramId}}{{#if @first}}"{{titleCase this}}" since {{/if}}{{/each}}{{#each facilityProgramStartDate}}{{#if @first}}{{this}}. {{/if}}{{/each}}{{/if}}{{#if employerName}}They have been continuously employed since {{#each employmentStartDate}}{{#if @first}}{{this}},{{/if}}{{/each}} and is currently employed with {{#each employerName}}{{#if @last}}"{{titleCase this}}"{{/if}}{{/each}}{{/if}}. {{#if studentStartDate}}They have been enrolled in an education program since {{#each studentStartDate}}{{#if @first}}{{this}}.{{/if}}{{/each}}{{/if}}',
          tooltip:
            "90 consecutive days employed, actively enrolled in an education program, or at a facility or institution for medical or psychological treatment. If you believe this is incorrect, please email feedback@recidiviz.org.",
        },
      ],
      initialHeader:
        "Search above to review and refer eligible clients for Credit Reviews.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1cPba5k8U16EF-xBqo9pCZkCqaddk3j_Y/view?usp=sharing",
      nonOmsCriteria: [
        {
          text: "{{#unless record.eligibleCriteria.drugScreenOkForCrr.atLeast30DaysSinceDrugScreen}}Needs drug test -- must test negative within the 30 days prior to submitting.{{/unless}}",
          tooltip:
            "If you believe this user has had a negative drug test within 30 days that is not appearing here, please email feedback@recidiviz.org.",
        },
      ],
      nonOmsCriteriaHeader: "Criteria to Check",
      notifications: [],
      omsCriteriaHeader: "Credit Review Requirements",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Supervision", "ActionHistory"],
      skipFormPreview: false,
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_NC",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Credit Reviews allow clients to earn time off their sentence if they meet certain criteria. This tool highlights clients who may be eligible for this opportunity using data from OPUS.",
      submittedTabTitle: "Submitted",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "creditReductionReview",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
