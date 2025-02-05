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

import simplur from "simplur";

import { fieldToDate } from "~datatypes";

import { formatDate } from "../../utils";
import { Task } from "./Task";
import { SupervisionTasksCaseType } from "./types";
import { US_ID_SUPERVISION_EMPLOYMENT_VERIFICATION_COMPLIANCE } from "./utils";

class UsIdEmploymentVerificationTask extends Task<"employment"> {
  displayName = "Employment";

  dueDateDisplayLong = `Employment Verification recommended ${this.dueDateFromToday}`;

  dueDateDisplayShort = `Recommended ${this.dueDateFromToday}`;

  get lastVerified(): string | undefined {
    if (!this.details.lastContacted) return;
    return formatDate(fieldToDate(this.details.lastContacted));
  }

  get supervisionLevel(): string | undefined {
    return this.details.supervisionLevel;
  }

  get caseType(): SupervisionTasksCaseType {
    return this.details.caseType;
  }

  get additionalDetails(): string | undefined {
    let details = "";
    if (this.lastVerified === undefined) {
      details = "No employment verification on record";
    } else {
      details = `Last employment verification was on ${this.lastVerified}`;
    }

    if (
      this.caseType === "SEX_OFFENSE" &&
      this.supervisionLevel !== undefined
    ) {
      const standard =
        US_ID_SUPERVISION_EMPLOYMENT_VERIFICATION_COMPLIANCE[
          this.supervisionLevel
        ];
      if (standard) {
        details += simplur`; ${standard.contacts} verification[|s] needed every ${standard.days} days for current case type`;
      }
    }

    return details;
  }
}

export default UsIdEmploymentVerificationTask;
