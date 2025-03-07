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

import { fieldToDate } from "~datatypes";

import { formatDate } from "../../utils/formatStrings";
import { Task } from "./Task";

class UsTxAssessmentTask extends Task<"usTxAssessment"> {
  displayName = "Assessment";

  dueDateDisplayLong = `${this.displayName} recommended ${this.dueDateFromToday}`;

  dueDateDisplayShort = `Recommended ${this.dueDateFromToday}`;

  get lastAssessment(): string | undefined {
    if (this.details.eventType !== "assessment_completed") return;
    return formatDate(fieldToDate(this.details.eventDate));
  }

  get additionalDetails(): string {
    return this.lastAssessment
      ? `Last assessment on ${this.lastAssessment}`
      : "No previous assessment on record.";
  }

  get frequency(): string {
    return "Every 6 months";
  }
}

export default UsTxAssessmentTask;
