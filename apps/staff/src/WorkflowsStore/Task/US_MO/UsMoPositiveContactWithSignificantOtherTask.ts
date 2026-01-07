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

import { fieldToDate } from "~datatypes";

import { formatWorkflowsDate, toTitleCase } from "../../../utils";
import { Task } from "../Task";

class UsMoPositiveContactWithSignificantOtherTask extends Task<"usMoPositiveContactWithSignificantOther"> {
  displayName = "Positive Contact with Significant Other";

  get additionalDetails() {
    const { lastContactDate } = this.details;
    return lastContactDate
      ? `Last positive contact with significant other on ${formatWorkflowsDate(fieldToDate(lastContactDate))}`
      : "No previous positive contact with significant other recorded during the current supervision level and/or case type.";
  }

  get frequency() {
    return toTitleCase(this.details.contactCadence);
  }
}

export default UsMoPositiveContactWithSignificantOtherTask;
