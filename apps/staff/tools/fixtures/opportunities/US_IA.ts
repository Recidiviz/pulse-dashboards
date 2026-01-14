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
    usIaCompleteSupervisionLevelDowngrade: {
      callToAction: null,
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "PENDING", text: "Has pending criminal charges" },
        {
          key: "PROGRAMMING",
          text: "Has not completed mandated interventions/programming",
        },
        { key: "SPECIAL", text: "Is not compliant with special conditions" },
        {
          key: "VIOLATIONS",
          text: "Has recently incurred serious violations or has pending violation reports",
        },
        {
          key: "MENTAL",
          text: "Has history of severe mental health disorders",
        },
        { key: "HOUSING", text: "Does not have stable housing" },
        { key: "EMPLOYMENT", text: "Does not have stable employment" },
      ],
      denialText: null,
      deniedTabTitle: "Snoozed",
      displayName: "Supervision Level Downgrade",
      dynamicEligibilityText:
        "client[|s] [is|are] awaiting actions related to Supervision Level Downgrade",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "supervisionLevelIsMediumOrMinimum",
          text: 'Is on supervision {{#if (eq supervisionLevel "MEDIUM")}}level 3{{else}}level 2{{/if}}',
          tooltip: "",
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
            "This is defined by whether there were any Reports of Violation submitted in ICON in the past 6 months. This does not include reports that resulted in a final decision of “Reinstate”, “Dismissed”, “No hearing held”, “Not filed with the court”, or “Probable cause not found”",
        },
        {
          key: "noSupervisionLevelDowngradeWithin6Months",
          text: "Has not been downgraded to a lower supervision level in the past 6 months",
        },
        {
          key: "notServingALifeSentenceOnSupervisionOrSupervisionOutOfState",
          text: '{{#unless (eq opportunity.person.supervisionType "PROBATION")}}Is not serving a lifetime sentence{{/unless}}',
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
          key: "usIaNotServingIneligibleOffenseForEarlyDischarge",
          text: "Is not serving for an offense that is ineligible for early discharge",
          tooltip:
            "See CBC-FS-02 Appendix A for a list of all ineligible offenses. Note that this only includes Iowa statutes, not NCIC or other state statute codes",
        },
        {
          key: "notSupervisionPastFullTermCompletionDateOrUpcoming30Days",
          text: "Is not within 30 days of discharge date",
          tooltip:
            "Discharge date is determined by the primary TDD (tentative discharge date) and/or SDD (supervision discharge date)",
        },
        {
          key: "notSupervisionPastGroupFullTermCompletionDateOrUpcoming30Days",
          text: "Is not within 30 days of discharge date",
          tooltip:
            "Discharge date is determined by the primary TDD (tentative discharge date) and/or SDD (supervision discharge date)",
        },
        {
          key: "usIaNotEligibleOrMarkedIneligibleForEarlyDischarge",
          text: "Is not eligible for early discharge",
          tooltip:
            "Clients who have been marked ineligible for early discharge in the Recidiviz tool due to fines & fees, being excluded from early discharge via court order, being denied early discharge by court/county attorney, and/or being an ICOTS-IN case can be eligible for a supervision level downgrade",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_IA-supervisionLevelDowngrade",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://docs.google.com/document/d/e/2PACX-1vQqlFtl1xFx92rX0jlal5N92klcsaALS2G9djBYNh-UNxuynROOOGXlb9zJg2NDeX11ZUxWclVD-kBo/pub",
      nonOmsCriteria: [
        {
          text: "Has no pending criminal charges or active warrants",
          tooltip:
            'Run NCIC check for pending charges + see "Relevant Contact Notes" section below for any active warrants & detainers entered in ICON',
        },
        {
          text: "Has completed any court-ordered interventions and/or programming",
          tooltip:
            'See "Relevant Contact Notes" section below for any required programming entered in ICON',
        },
        {
          text: '{{#if (eq record.eligibleCriteria.supervisionLevelIsMediumOrMinimum.supervisionLevel "MEDIUM")}}Completed DRAOR Assessment{{/if}}',
        },
      ],
      nonOmsCriteriaHeader: "Requirements for officers to check",
      notifications: [],
      omsCriteriaHeader: "Requirements validated by data from ICON",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_IA",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: "Downgraded",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Eligible Now",
            "Pending Eligibility",
            "Downgraded",
            "Snoozed",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "supervisionLevelDowngrade",
      zeroGrantsTooltip: null,
    },
    usIaEarlyDischarge: {
      callToAction: null,
      caseNotesTitle: null,
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
          text: "Has recently been denied early discharge by court or county attorney",
        },
        {
          key: "VIOLATIONS",
          text: "Has recently incurred serious violations or has pending violation reports",
        },
        {
          key: "INTERSTATE (IC-IN)",
          text: "Is serving an ICOTS case and sentencing state did not approve early discharge",
        },
        {
          key: "INTERSTATE (IC-OUT)",
          text: "Is serving an ICOTS case and supervising state has not provided progress report or other necessary information",
        },
      ],
      denialText: null,
      deniedTabTitle: "Snoozed",
      displayName: "Early Discharge",
      dynamicEligibilityText:
        "client[|s] [is|are] awaiting actions related to Early Discharge",
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
            "This is defined by whether there were any Reports of Violation submitted in ICON in the past 6 months. This does not include reports that resulted in a final decision of “Reinstate”,  “Dismissed”, “No hearing held”, “Not filed with the court”, or “Probable cause not found”",
        },
        {
          key: "notServingALifeSentenceOnSupervisionOrSupervisionOutOfState",
          text: '{{#unless (eq opportunity.person.supervisionType "PROBATION")}}Is not serving a lifetime sentence{{/unless}}',
          tooltip: "",
        },
        {
          key: "usIaNotExcludedFromEarlyDischargeByParoleCondition",
          text: '{{#unless (eq opportunity.person.supervisionType "PROBATION")}}Is not excluded from early discharge by Iowa Board of Parole condition{{/unless}}',
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
          tooltip:
            "This is defined by whether a client has paid their most recent $300 supervision fee, regardless of the status of other types of fines or fees",
        },
        {
          key: "usIaNotServingIneligibleOffenseForEarlyDischarge",
          text: "Is not serving for an offense that is ineligible for early discharge",
          tooltip:
            "See CBC-FS-02 Appendix A for a list of all ineligible offenses. Note that this only includes Iowa statutes, not NCIC or other state statute codes",
        },
        {
          key: "notSupervisionPastFullTermCompletionDateOrUpcoming30Days",
          text: "Is not within 30 days of discharge date",
          tooltip:
            "Discharge date is determined by the primary TDD (tentative discharge date) and/or SDD (supervision discharge date)",
        },
        {
          key: "notSupervisionPastGroupFullTermCompletionDateOrUpcoming30Days",
          text: "Is not within 30 days of discharge date",
          tooltip:
            "Discharge date is determined by the primary TDD (tentative discharge date) and/or SDD (supervision discharge date)",
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
          text: "Has no pending criminal charges or active warrants",
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
          text: '{{#if (or (eq opportunity.person.supervisionType "PROBATION") (eq opportunity.person.supervisionType "DUAL"))}}Has paid court fees in full (for probation clients){{/if}}',
        },
        {
          text: '{{#if (or (eq opportunity.person.supervisionType "PAROLE") (eq opportunity.person.supervisionType "DUAL"))}}Has consistent payments or a payment plan for court fees (for parole clients){{/if}}',
        },
        {
          text: '{{#if (or (eq opportunity.person.supervisionType "PROBATION") (eq opportunity.person.supervisionType "DUAL"))}}Not excluded from early discharge via court order (for probation clients only){{/if}}',
          tooltip: "",
        },
        {
          text: '{{#unless record.metadata.dnaSubmittedFlag}}{{#unless (eq record.metadata.dnaRequirementStatus "Not Required")}}DNA has been collected and uploaded to CODIS if required{{/unless}}{{/unless}}',
          tooltip:
            "ICON indicates that for this client, DNA may be required to be collected but has not yet been collected",
        },
        {
          text: "{{#if record.metadata.victimFlag}}There is a registered victim in ICON. Contact required before discharge.{{/if}}",
        },
      ],
      nonOmsCriteriaHeader: "Requirements for officers to check",
      notifications: [],
      omsCriteriaHeader: "Requirements validated by data from ICON",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "UsIaEarlyDischargeIcOutDetails",
        "UsIaActionPlansAndNotes",
        "ClientProfileDetails",
        "CaseNotes",
        "UsIaVictimContactInfo",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_IA",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: "Forms Submitted",
      supportsIneligible: false,
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
