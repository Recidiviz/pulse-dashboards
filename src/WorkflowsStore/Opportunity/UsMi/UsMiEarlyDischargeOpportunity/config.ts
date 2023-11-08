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
import { UsMiEarlyDischargeOpportunity } from "./UsMiEarlyDischargeOpportunity";

export const usMiEarlyDischargeConfig: OpportunityConfig<UsMiEarlyDischargeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_MI",
    urlSection: "earlyDischarge",
    label: "Early Discharge",
    hydratedHeader: (count: number) => ({
      eligibilityText: simplur`${[
        count,
        oppHeaderCountFormatter,
      ]} client[|s] may be `,
      opportunityText: "eligible for early discharge",
      callToAction:
        "Review clients who may be eligible for early discharge and complete discharge paperwork in COMS.",
    }),
    firestoreCollection: "US_MI-earlyDischargeReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
  };
