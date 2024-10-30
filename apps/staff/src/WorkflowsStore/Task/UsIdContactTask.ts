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
import { US_ID_SUPERVISION_LEVEL_CONTACT_COMPLIANCE } from "./utils";

class UsIdContactTask extends Task<"contact"> {
  displayName = "Contact";

  dueDateDisplayLong = `${this.displayName} recommended ${this.dueDateFromToday}`;

  dueDateDisplayShort = `Recommended ${this.dueDateFromToday}`;

  get lastContacted(): string | undefined {
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
    if (!this.supervisionLevel) return;
    const complianceLevel =
      US_ID_SUPERVISION_LEVEL_CONTACT_COMPLIANCE[this.caseType][
        this.supervisionLevel
      ];
    let details = "";
    if (this.lastContacted) {
      details += `Last contact was on: ${this.lastContacted}; `;
    }
    if (complianceLevel) {
      details += simplur`${complianceLevel.contacts} contact[|s] needed every ${complianceLevel.days} days, for current supervision level and case type`;
    }

    return details;
  }
}

export default UsIdContactTask;
