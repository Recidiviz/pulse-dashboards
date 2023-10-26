// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import simplur from "simplur";

import {
  oppHeaderCountFormatter,
  OpportunityConfig,
} from "../../OpportunityConfigs";

export const usMeSCCPConfig: OpportunityConfig = {
  stateCode: "US_ME",
  urlSection: "SCCP",
  label: "Supervised Community Confinement Program",
  initialHeader:
    "Search for case managers above to review residents in their unit who are approaching SCCP " +
    "eligibility and complete application paperwork.",
  hydratedHeader: (count: number) => ({
    eligibilityText: simplur`${[
      count,
      oppHeaderCountFormatter,
    ]} resident[|s] may be eligible for the `,
    opportunityText: "Supervised Community Confinement Program",
    callToAction:
      "Search for case managers above to review residents in their unit who are approaching " +
      "SCCP eligibility and complete application paperwork.",
  }),
  firestoreCollection: "US_ME-SCCPReferrals",
  snooze: {
    defaultSnoozeDays: 30,
    maxSnoozeDays: 180,
  },
};
