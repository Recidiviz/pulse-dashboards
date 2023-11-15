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
import { UsMiSupervisionLevelDowngradeOpportunity } from "./UsMiSupervisionLevelDowngradeOpportunity";

export const usMiSupervisionLevelDowngradeConfig: OpportunityConfig<UsMiSupervisionLevelDowngradeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_MI",
    urlSection: "supervisionLevelMismatch",
    label: "Supervision Level Mismatch",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] within their first 6 months of supervision [is|are] being `,
      opportunityText:
        "supervised at a level that does not match their latest risk score",
      callToAction:
        "Review clients whose supervision level does not match their risk level and change supervision levels in COMS.",
    }),
    firestoreCollection: "US_MI-supervisionLevelDowngrade",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
  };
