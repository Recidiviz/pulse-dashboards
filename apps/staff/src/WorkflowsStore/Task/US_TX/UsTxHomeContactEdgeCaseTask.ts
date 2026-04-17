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

import { toDateList } from "~datatypes";

import {
  formatWorkflowsDateString,
  toTitleCase,
} from "../../../utils/formatStrings";
import { Task } from "../Task";

class UsTxHomeContactEdgeCaseTask extends Task<"usTxHomeContactEdgeCase"> {
  vitalsMetricId = "timely_contact_due_date_based" as const;

  get additionalDetails(): string {
    return `Event Date: ${formatWorkflowsDateString(this.details.causalDate)}`;
  }

  get frequency(): string {
    return toTitleCase(this.details.contactCadence);
  }

  get scheduledContactDates() {
    if (!this.details.scheduledContactDates) return [];
    return toDateList(this.details.scheduledContactDates);
  }
}

export default UsTxHomeContactEdgeCaseTask;
