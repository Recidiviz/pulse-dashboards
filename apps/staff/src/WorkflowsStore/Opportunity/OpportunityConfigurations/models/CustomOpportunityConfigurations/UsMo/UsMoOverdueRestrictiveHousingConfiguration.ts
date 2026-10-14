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

import { startOfWeek } from "date-fns";

import { formatWorkflowsDate } from "../../../../../../utils";
import { PartialRecord } from "../../../../../../utils/typeUtils";
import { OpportunityTab } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsMoOverdueRestrictiveHousingConfiguration extends ApiOpportunityConfiguration {
  countFromTabCounts = (counts: PartialRecord<OpportunityTab, number>) => {
    // The overdue tab embeds a date, so it is matched by prefix rather than
    // named. `OpportunityTab` carries `\`Overdue as of ${string}\`` for it.
    const tabs = Object.keys(counts) as OpportunityTab[];
    const overdueTab = tabs.find((tab) => tab.startsWith("Overdue as of"));
    return overdueTab
      ? counts[overdueTab] ?? 0
      : counts["Due this week"] || counts["Coming up"] || 0;
  };

  get tabGroups() {
    return {
      "ELIGIBILITY STATUS": [
        `Overdue as of ${formatWorkflowsDate(
          startOfWeek(new Date(), { weekStartsOn: 1 }),
        )}`,
        "Due this week",
        "Coming up",
        this.deniedTabTitle,
      ],
    } as const;
  }

  get supportsAlmostEligible() {
    return true;
  }
}
