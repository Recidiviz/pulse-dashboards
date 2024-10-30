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

import { formatDate } from "../../utils";
import { Task } from "./Task";

class UsIdRiskAssessmentTask extends Task<"assessment"> {
  displayName = "Risk assessment";

  dueDateDisplayLong = `${this.displayName} due ${this.dueDateFromToday}`;

  dueDateDisplayShort = `Due ${this.dueDateFromToday}`;

  get additionalDetails(): string | undefined {
    let details = "";

    if (this.lastAssessedOn) {
      details += `Last assessed on ${this.lastAssessedOn}; `;
    }

    if (this.riskLevel) {
      details += `Score: ${this.riskLevel}`;
    }

    return details;
  }

  get lastAssessedOn(): string | undefined {
    if (!this.details.lastAssessedOn) return;
    return formatDate(fieldToDate(this.details.lastAssessedOn));
  }

  get riskLevel(): string | null {
    return this.details.riskLevel;
  }
}

export default UsIdRiskAssessmentTask;
