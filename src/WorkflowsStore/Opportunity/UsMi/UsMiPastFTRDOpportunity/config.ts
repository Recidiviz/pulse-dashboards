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
import { add } from "date-fns";
import simplur from "simplur";

import {
  oppHeaderCountFormatter,
  OpportunityConfig,
} from "../../OpportunityConfigs";

export const usMiPastFTRDConfig: OpportunityConfig = {
  stateCode: "US_MI",
  urlSection: "pastFTRD",
  label: "Overdue for Discharge",
  hydratedHeader: (count: number) => ({
    eligibilityText: simplur`${[
      count,
      oppHeaderCountFormatter,
    ]} client[|s] [is|are] nearing or `,
    opportunityText: "past their full-term release date",
    callToAction:
      "Review clients who are nearing or past their full-term release date and complete discharges in COMS.",
  }),
  firestoreCollection: "US_MI-pastFTRDReferrals",
  snooze: {
    defaultSnoozeUntilFn: (snoozedOn: Date) => add(snoozedOn, { days: 30 }),
  },
};
