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

import { formatWorkflowsDate, toTitleCase } from "../../../utils/formatStrings";
import { Task } from "../Task";

class UsTxAssessmentTask extends Task<"usTxAssessment"> {
  displayName = this.details.dueAssessmentType
    ? `TRAS - ${this.details.dueAssessmentType.replaceAll("TX_", "")}`
    : "TRAS";

  get lastEventDate(): string | undefined {
    return formatWorkflowsDate(fieldToDate(this.details.eventDate));
  }

  get lastEventCopy(): string | undefined {
    switch (this.details.eventType) {
      case "case_type_start":
      case "case_type_end":
        return "Case type change";
      case "assessment_completed":
        return "Last TRAS";
      case "supervision_start_no_prior_assessment":
      default:
        // We don't expect other event types, but we should still display reasonable copy
        return;
    }
  }

  get additionalDetails(): string {
    return this.lastEventCopy && this.lastEventDate
      ? `${this.lastEventCopy}: ${this.lastEventDate}`
      : "No previous TRAS on record";
  }

  get frequency(): string {
    return `1 Every ${toTitleCase(this.details.frequency)}`;
  }
}

export default UsTxAssessmentTask;
