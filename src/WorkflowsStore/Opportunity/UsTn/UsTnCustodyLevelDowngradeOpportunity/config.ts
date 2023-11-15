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

import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsTnCustodyLevelDowngradeOpportunity } from "./UsTnCustodyLevelDowngradeOpportunity";

export const usTnCustodyLevelDowngradeConfig: OpportunityConfig<UsTnCustodyLevelDowngradeOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_TN",
    urlSection: "custodyLevelDowngrade",
    label: "Custody Level Downgrade",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} resident[|s] may be eligible for a`,
      opportunityText: "custody level downgrade",
      callToAction: "Review and update custody levels.",
    }),
    firestoreCollection: "US_TN-custodyLevelDowngradeReferrals",
    snooze: {
      defaultSnoozeUntilFn: (snoozedOn: Date) => add(snoozedOn, { days: 30 }),
    },
  };
