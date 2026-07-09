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
import { UsTn2026ClassificationConfiguration } from "./UsTn2026ClassificationConfiguration";

// Extends UsTn2026ClassificationConfiguration to inherit the shared 2026 classification behavior
// and only override for this specific opportunity's enabledColumns
export class UsTnCustodyLevelDowngrade2026PolicyConfiguration extends UsTn2026ClassificationConfiguration {
  get enabledColumns(): Array<OpportunityTableColumnId> {
    const cols = [...super.enabledColumns];
    cols.push("US_TN_LATEST_CLASSIFICATION_DATE");
    return cols;
  }
}
