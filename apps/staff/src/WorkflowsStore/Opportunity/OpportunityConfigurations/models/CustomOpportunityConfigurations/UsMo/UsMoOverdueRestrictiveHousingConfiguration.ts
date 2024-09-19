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
import { countBy } from "lodash";

import { formatWorkflowsDate } from "../../../../../../utils";
import {
  Opportunity,
  OpportunityRequirement,
  OpportunityTab,
  OpportunityTabGroups,
} from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsMoOverdueRestrictiveHousingConfiguration extends ApiOpportunityConfiguration {
  countByFunction = (opportunities: Opportunity[]) => {
    const counts = countBy(opportunities, (opp) => opp.tabTitle()) as Record<
      OpportunityTab,
      number
    >;
    const tabs = Object.keys(counts) as OpportunityTab[];
    const overdueTab = tabs.find((tab) => tab.startsWith("Overdue as of"));
    const count = overdueTab
      ? counts[overdueTab]
      : counts["Due this week"] || counts["Coming up"] || 0;
    return count;
  };

  get tabGroups() {
    return {
      "ELIGIBILITY STATUS": [
        `Overdue as of ${formatWorkflowsDate(
          startOfWeek(new Date(), { weekStartsOn: 1 }),
        )}`,
        "Due this week",
        "Coming up",
        "Overridden",
        "Missing Review Date",
      ],
    } as OpportunityTabGroups;
  }

  get omsCriteriaHeader() {
    return "Example of customizable header";
  }

  get nonOMSCriteria(): OpportunityRequirement[] {
    // Placeholders for testing UI changes
    return [
      {
        text: "A first external criterion to test non-OMS requirements",
        tooltip:
          "A long tooltip that has a substantial amount of text in it describing a policy.",
      },
      {
        text: "Another external criterion to test non-OMS requirements, which is very long and extends to multiple lines",
        tooltip: "A slightly shorter tooltip",
      },
      {
        text: "Third criterion",
        tooltip: "Tooltip",
      },
      {
        text: "Fourth criterion",
        tooltip: "Tooltip",
      },
    ];
  }
}
