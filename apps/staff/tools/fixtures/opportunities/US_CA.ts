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
    usCaSupervisionLevelDowngrade: {
      callToAction:
        "Review clients who may be eligible for a Supervision Level Downgrade and complete the paperwork.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [{ key: "Other", text: "Other: please specify a reason" }],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Supervision Level Downgrade",
      dynamicEligibilityText:
        "client[|s] may be eligible for a supervision level downgrade",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usCaAssessmentLevel3OrLower",
          text: "Currently has a CSRA risk score of 3 or lower",
          tooltip:
            "Category B Cases: Primarily reserved for parolees whose risk level is moderate with a CSRA score of 2.\n\nPer user feedback, Recidiviz also surfaces clients with CSRA scores of 3 for your review.",
        },
        {
          key: "supervisionLevelIsHighFor6Months",
          text: "Has been Category A for 6 or more months",
          tooltip:
            "The following guidelines to change supervision levels, based on the case conference review rating scale stating “reduction is warranted” may be followed: Category A to Category B",
        },
        {
          key: "usCaHousingTypeIsNotTransient",
          text: "Has maintained residence stability in a positive living environment",
          tooltip:
            "Based on Objective 1 from the Case Conference Review, the following should be considered: (1) Has the parolee been in the same pro-social living situation for the review period, or when the most recent move was to improve\noverall living conditions, and will continue to be available to the parolee. (2) Has the parolee been in two or more living situations for the review period with any move not improving the living conditions. (3) Has the parolee demonstrated an unstable living environment, is transient or routinely difficult to see at the residence of record.",
        },
        {
          key: "noSupervisionViolationWithin6Months",
          text: "No substantiated violation in the last 6 months",
          tooltip:
            "The parolee has been compliant with his or her general and special conditions of parole.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_CA-supervisionLevelDowngrade",
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
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_CA",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading: null,
      submittedTabTitle: null,
      supportsSubmitted: false,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for supervision downgrade",
      urlSection: "supervisionLevelDowngrade",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
