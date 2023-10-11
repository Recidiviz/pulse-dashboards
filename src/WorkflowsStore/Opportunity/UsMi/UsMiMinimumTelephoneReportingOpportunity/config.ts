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

export const usMiMinimumTelephoneReportingConfig: OpportunityConfig = {
  stateCode: "US_MI",
  urlSection: "minimumTelephoneReporting",
  label: "Minimum Telephone Reporting",
  hydratedHeader: (count: number) => ({
    // TODO: Update the copy.
    eligibilityText: simplur`${[
      count,
      oppHeaderCountFormatter,
    ]} client[|s] may be eligible for a downgrade to `,
    opportunityText: "minimum telephone reporting",
    callToAction:
      "Review clients who meet the requirements for minimum telephone reporting and change supervision levels in COMS.",
  }),
  snooze: {
    defaultSnoozeDays: 30,
    maxSnoozeDays: 90,
  },
};
