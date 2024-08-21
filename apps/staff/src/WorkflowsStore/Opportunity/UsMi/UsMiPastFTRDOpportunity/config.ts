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

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsMiPastFTRDOpportunity } from "./UsMiPastFTRDOpportunity";

export const usMiPastFTRDConfig: OpportunityConfig<UsMiPastFTRDOpportunity> = {
  systemType: "SUPERVISION",
  stateCode: "US_MI",
  urlSection: "pastFTRD",
  label: "Overdue for Discharge",
  dynamicEligibilityText:
    "client[|s] [is|are] nearing or past their full-term release date",
  callToAction:
    "Review clients who are nearing or past their full-term release date and complete discharges in COMS.",
  subheading:
    "This alert helps staff identify supervision clients who are past their full-term release date and directs staff to complete the discharge in COMS.",
  firestoreCollection: "US_MI-pastFTRDReferrals",
  snooze: {
    autoSnoozeParams: {
      type: "snoozeDays",
      params: {
        days: 30,
      },
    },
  },
  isAlert: true,
  sidebarComponents: ["ClientProfileDetails"],
  tooltipEligibilityText: "Eligible for discharge",
  methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
  denialReasons: {
    DATE: "Expiration date is inaccurate",
    CUSTODY: "Client is currently in custody",
    Other: "Other: please specify a reason",
  },
  eligibleCriteriaCopy: {
    supervisionPastFullTermCompletionDate: {
      text: "{{daysPast eligibleDate}} days past FTRD ({{date eligibleDate}})",
    },
  },
  ineligibleCriteriaCopy: {
    supervisionPastFullTermCompletionDate: {
      text: "{{daysUntil eligibleDate}} days until FTRD ({{date eligibleDate}})",
    },
  },
  homepagePosition: 4,
};
