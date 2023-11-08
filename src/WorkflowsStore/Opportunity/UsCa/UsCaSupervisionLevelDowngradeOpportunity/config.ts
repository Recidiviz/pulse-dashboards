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
import { UsCaSupervisionLevelDowngradeOpportunity } from "./UsCaSupervisionLevelDowngradeOpportunity";

export const usCaSupervisionLevelDowngradeConfig: OpportunityConfig<UsCaSupervisionLevelDowngradeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_CA",
    urlSection: "supervisionLevelDowngrade",
    label: "Supervision Level Downgrade",
    hydratedHeader: (count: number) => ({
      eligibilityText: simplur`${[
        count,
        oppHeaderCountFormatter,
      ]} client[|s] may be `,
      opportunityText: "eligible for a supervision level downgrade",
      callToAction:
        "Review clients who may be eligible for a Supervision Level Downgrade and complete the paperwork.",
    }),
    firestoreCollection: "US_CA-supervisionLevelDowngrade",
  };
