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

import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsOrEarlyDischargeOpportunity } from "./UsOrEarlyDischargeOpportunity";

export const usOrEarlyDischargeConfig: OpportunityConfig<UsOrEarlyDischargeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_OR",
    urlSection: "earlyDischarge",
    label: "Early Discharge",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be `,
      opportunityText: "eligible for early discharge",
      callToAction:
        "Review clients who may be eligible for Early Discharge and complete the paperwork.",
    }),
    firestoreCollection: "US_OR-earlyDischarge",
  };