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

export const usMeWorkReleaseConfig: OpportunityConfig = {
  stateCode: "US_ME",
  urlSection: "workRelease",
  label: "Work Release",
  featureVariant: "usMeWorkRelease",
  hydratedHeader: (count: number) => ({
    eligibilityText: simplur`${[
      count,
      oppHeaderCountFormatter,
    ]} client[|s] may be `,
    opportunityText:
      "eligible for the Community Transition Program (Work Release)",
    callToAction:
      "Search for case managers above to review residents on their caseload who are approaching " +
      "Work Release eligibility and complete application paperwork.",
  }),
  snooze: {
    defaultSnoozeDays: 30,
    maxSnoozeDays: 180,
  },
};
