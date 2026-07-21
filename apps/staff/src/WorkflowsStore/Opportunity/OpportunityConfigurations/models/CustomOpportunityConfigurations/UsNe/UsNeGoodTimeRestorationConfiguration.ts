// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { OpportunityTableColumnId } from "../../../../../../core/OpportunityCaseloadView/HydratedOpportunityPersonList";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsNeGoodTimeRestorationConfiguration extends ApiOpportunityConfiguration {
  get enabledColumns(): Array<OpportunityTableColumnId> {
    const cols = [...super.enabledColumns];
    const colsToAdd: OpportunityTableColumnId[] = [
      "UNIT_ID",
      "US_NE_ELIGIBLE_RESTORATION_AMT",
      "US_NE_TOTAL_LOST_RESTORABLE_GT",
    ].filter(
      (c) => !cols.includes(c as OpportunityTableColumnId),
    ) as OpportunityTableColumnId[];
    return [...cols, ...colsToAdd];
  }

  get pendingOverdueDaysThreshold() {
    return 14;
  }

  get eligibleNotViewedDaysThreshold() {
    return 14;
  }

  get indefiniteSnoozeSectionSubheading(): string {
    return "";
  }

  get maxSnoozeDaysByDenialReason() {
    return {
      ...super.maxSnoozeDaysByDenialReason,
      COURT_ORDER: undefined,
    };
  }

  // TODO(#11250): Update sidebar components in admin panel and delete this override
  get sidebarComponents() {
    return [...super.sidebarComponents, "UsNeGoodTimeLedger"];
  }
}
