// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

export class UsIdOverdueFaceToFaceContactConfiguration extends ApiOpportunityConfiguration {
  get enabledColumns(): Array<OpportunityTableColumnId> {
    const cols = [...super.enabledColumns];
    const colsToAdd: OpportunityTableColumnId[] = [
      "US_ID_LAST_VIEWED",
      "US_ID_LAST_CONTACT_DATE",
      "US_ID_SUPERVISION_LEVEL",
      "US_ID_CASE_TYPE",
      "US_ID_CONTACT_DUE_DATE",
      "US_ID_CONTACT_CADENCE",
    ].filter(
      (c) => !cols.includes(c as OpportunityTableColumnId),
    ) as OpportunityTableColumnId[];
    const colsToRemove: OpportunityTableColumnId[] = [
      "STATUS",
      "LAST_VIEWED",
      "SUPERVISION_EXPIRATION_DATE",
    ];
    // SUPERVISION_EXPIRATION_DATE uses contact-specific columns instead
    return [...cols, ...colsToAdd].filter((c) => !colsToRemove.includes(c));
  }
}
