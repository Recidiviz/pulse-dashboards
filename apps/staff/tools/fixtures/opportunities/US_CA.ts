// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
      denialReasons: [{ key: "Other", text: "Other: please specify a reason" }],
      denialText: null,
      displayName: "Supervision Level Downgrade",
      dynamicEligibilityText:
        "client[|s] may be eligible for a supervision level downgrade",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      firestoreCollection: "US_CA-supervisionLevelDowngrade",
      hideDenialRevert: false,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      methodologyUrl: "TBD",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_CA",
      subheading: null,
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: "Eligible for supervision downgrade",
      urlSection: "supervisionLevelDowngrade",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
