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
    usIaEarlyDischarge: {
      callToAction: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "FINES & FEES", text: "Has unpaid court fees or restitution " },
        { key: "PENDING", text: "Has pending criminal charges" },
        {
          key: "PROGRAMMING",
          text: "Has not completed mandated interventions/programming",
        },
        { key: "SPECIAL", text: "Is not compliant with special conditions" },
        { key: "PUBLIC SAFETY", text: "Poses a public safety risk" },
        {
          key: "COURT",
          text: "Is excluded from early discharge via court order ",
        },
        {
          key: "DENIED",
          text: "Has recently been denied early discharge in court",
        },
        {
          key: "VIOLATIONS",
          text: "Has pending violations (TKTK final copy here) ",
        },
        {
          key: "INTERSTATE",
          text: "Is an interstate compact case and has been denied early discharge by other state ",
        },
      ],
      denialText: null,
      deniedTabTitle: "Snoozed",
      displayName: "Early Discharge",
      dynamicEligibilityText:
        "client[|s] are awaiting actions related to Early Discharge",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usIaSupervisionLevelIs0NotAvailable12Or3",
          text: "Is on supervision {{lowerCase supervisionLevelRawText}}",
          tooltip:
            "Client must be on supervision level 0 - Not available for supervision (ICOTS), 1, 2, or 3",
        },
        {
          key: "usIaServingSupervisionCaseAtLeast90Days",
          text: "90 days have passed since case assignment",
          tooltip:
            "Case assignment is defined as whenever a client began supervision or began serving a new sentence",
        },
        {
          key: "noSupervisionViolationReportWithin6MonthsUsingResponseDate",
          text: "Has no violation reports in the past 6 months",
          tooltip:
            'This is defined by whether there were any Reports of Violation submitted in ICON in the past 6 months. See "Relevant Contact Notes" section below to review all violation incidents entered in ICON',
        },
        {
          key: "usIaNoOpenSupervisionModifiers",
          text: "Has no open supervision modifiers",
          tooltip:
            "This includes all modifiers except those that specify out of state supervision",
        },
        {
          key: "supervisionCaseTypeIsNotSexOffense",
          text: "Has no sex offender specialty",
        },
        {
          key: "usIaSupervisionFeesPaid",
          text: "Has paid their most recent supervision fee",
        },
        {
          key: "usIaNotServingIneligibleOffenseForEarlyDischarge",
          text: "Is not serving for an offense that is ineligible for early discharge",
          tooltip:
            "See CBC-FS-02 Appendix A for a list of all ineligible offenses",
        },
        {
          key: "notServingALifeSentenceOnSupervisionOrSupervisionOutOfState",
          text: '{{#unless (eq opportunity.person.supervisionType "PROBATION")}}Is not serving a lifetime sentence{{/unless}}',
          tooltip: "",
        },
        {
          key: "notSupervisionPastFullTermCompletionDateOrUpcoming30Days",
          text: "Is not within 30 days of discharge date",
          tooltip:
            "Discharge date is determined by the maximum value of the client's TDD (tentative discharge date) and/or SDD (supervision discharge date)",
        },
        {
          key: "usIaNotExcludedFromEarlyDischargeByParoleCondition",
          text: '{{#unless (eq opportunity.person.supervisionType "PROBATION")}}Is not excluded from early discharge by board of parole condition{{/unless}}',
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_IA-earlyDischarge",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://docs.google.com/document/d/e/2PACX-1vQqlFtl1xFx92rX0jlal5N92klcsaALS2G9djBYNh-UNxuynROOOGXlb9zJg2NDeX11ZUxWclVD-kBo/pub",
      nonOmsCriteria: [
        {
          text: "Has no pending criminal charges",
          tooltip:
            'Run NCIC check for pending charges + see "Relevant Contact Notes" section below for any active warrants & detainers entered in ICON',
        },
        {
          text: "Has completed any court-ordered interventions and/or programming",
          tooltip:
            'See "Relevant Contact Notes" section below for any required programming entered in ICON',
        },
        { text: "Has paid restitution in full", tooltip: "" },
        {
          text: '{{#if (or (eq opportunity.person.supervisionType "PROBATION") (eq opportunity.person.supervisionType "DUAL"))}}Not excluded from early discharge via court order (for probation clients only){{/if}}',
          tooltip: "",
        },
        {
          text: "{{#if record.metadata.victimFlag}}Registered victim has been contacted{{/if}}",
        },
        {
          text: "{{#if record.metadata.dnaRequiredFlag}}{{#unless record.metadata.dnaSubmittedFlag}}DNA has been collected{{/unless}}{{/if}}",
          tooltip:
            "ICON indicates that for this client, DNA is required to be collected but has not yet been collected",
        },
        {
          text: '{{#if (or (eq opportunity.person.supervisionType "PAROLE") (eq opportunity.person.supervisionType "DUAL"))}}Has consistent payments or a payment plan for court fees (for parole clients){{/if}}',
        },
        {
          text: '{{#if (or (eq opportunity.person.supervisionType "PROBATION") (eq opportunity.person.supervisionType "DUAL"))}}Has paid court fees in full (for probation clients){{/if}}',
        },
      ],
      nonOmsCriteriaHeader: "Requirements for officers to check",
      notifications: [],
      omsCriteriaHeader: "Requirements validated by data from ICON",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "UsIaActionPlansAndNotes",
        "ClientProfileDetails",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_IA",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: "Forms Submitted",
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Eligible Now",
            "Ready for Discharge",
            "Revisions Requests",
            "Supervisor Review",
            "Forms Submitted",
            "Snoozed",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "earlyDischarge",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
