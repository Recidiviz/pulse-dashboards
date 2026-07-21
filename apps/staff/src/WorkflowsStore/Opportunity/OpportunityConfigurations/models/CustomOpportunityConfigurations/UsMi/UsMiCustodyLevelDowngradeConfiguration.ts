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
import { DenialInputSettings } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsMiCustodyLevelDowngradeConfiguration extends ApiOpportunityConfiguration {
  get enabledColumns(): Array<OpportunityTableColumnId> {
    const cols = [...super.enabledColumns];
    const colsToAdd: OpportunityTableColumnId[] = [
      "US_MI_ERD",
      "US_MI_CUSTODY_LEVEL",
      "DENIAL_REASONS",
    ].filter(
      (c) => !cols.includes(c as OpportunityTableColumnId),
    ) as OpportunityTableColumnId[];
    const colsToRemove: OpportunityTableColumnId[] = ["RELEASE_DATE"];
    return [...cols, ...colsToAdd].filter((c) => !colsToRemove.includes(c));
  }

  get denialInputSettings(): Record<string, DenialInputSettings> {
    return {
      PROGRAMMING: {
        required: true,
        heading: "Programming details:",
        placeholder:
          "Please specify what programming is pending and when the programming is expected to be started and completed",
        inputType: "text",
        minCharacters: 3,
        maxCharacters: 1000,
      },
      ACCOMMODATION: {
        required: true,
        heading: "Accommodation details:",
        placeholder:
          "Please specify the required accommodations that are unavailable at other facilities or housing units",
        inputType: "text",
        minCharacters: 3,
        maxCharacters: 1000,
      },
    };
  }
}
