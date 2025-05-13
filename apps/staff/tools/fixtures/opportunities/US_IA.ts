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
      denialReasons: [{ key: "FINES & FEES", text: "TKTKTK fines & fees" }],
      denialText: null,
      deniedTabTitle: "Snoozed",
      displayName: "Early Discharge",
      dynamicEligibilityText: "client[|s] may be eligible for early discharge",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usIaSupervisionLevelIs0NotAvailable12Or3",
          text: "Is on supervision level 3, 2, 1, or 0 - Not available for supervision (ICOTS)",
        },
        {
          key: "usIaNoOpenSupervisionModifiers",
          text: "Has no open supervision modifiers",
        },
        {
          key: "supervisionCaseTypeIsNotSexOffense",
          text: "Does not have a sex offender specialty",
        },
        {
          key: "usIaNotServingIneligibleOffenseForEarlyDischarge",
          text: "Is not serving for an offense that is ineligible for early discharge",
          tooltip:
            "See CBC-FS-02 Appendix A for a list of all ineligible offenses",
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
          tooltip: "Run NCIC check to determine status of pending charges",
        },
        {
          text: "{{#if record.metadata.victimFlag}}Registered victim has been contacted{{/if}}",
        },
      ],
      nonOmsCriteriaHeader: "Requirements for officers to check",
      notifications: [],
      omsCriteriaHeader: "Requirements validated by data from ICON",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
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
