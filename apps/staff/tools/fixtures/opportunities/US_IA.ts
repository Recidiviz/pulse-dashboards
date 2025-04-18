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
        { key: "FINES & FEES", text: "TKTKTK figure out probationer/parolee" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Early Discharge",
      dynamicEligibilityText: "client[|s] may be eligible for early discharge",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usIaNoOpenSupervisionModifiers",
          text: "The client has no open supervision modifiers",
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
      nonOmsCriteria: [{ text: "The client consents to early discharge" }],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_IA",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "earlyDischarge",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
