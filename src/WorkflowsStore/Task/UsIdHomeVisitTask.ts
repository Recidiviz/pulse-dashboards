/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import simplur from "simplur";

import { formatDate } from "../../utils";
import { fieldToDate } from "../utils";
import { Task } from "./Task";
import { US_ID_SUPERVISION_LEVEL_HOME_VISIT_COMPLIANCE } from "./utils";

class UsIdHomeVisitTask extends Task<"homeVisit"> {
  displayName = "Home contact";

  dueDateDisplayLong = `${this.displayName} recommended ${this.dueDateFromToday}`;

  dueDateDisplayShort = `Recommended ${this.dueDateFromToday}`;

  get currentAddress(): string | undefined {
    return this.details.currentAddress;
  }

  get supervisionLevel(): string {
    return this.details.supervisionLevel;
  }

  get lastHomeVisit(): string | undefined {
    if (!this.details.lastHomeVisit) return;
    return formatDate(fieldToDate(this.details.lastHomeVisit));
  }

  get additionalDetails(): string {
    let details = "";
    const complianceLevel =
      US_ID_SUPERVISION_LEVEL_HOME_VISIT_COMPLIANCE[this.supervisionLevel];

    if (this.lastHomeVisit) {
      details += `Last home contact on: ${this.lastHomeVisit}; `;
    }
    if (complianceLevel) {
      details += simplur`${complianceLevel.contacts} home contact[|s] needed every ${complianceLevel.days} days, for current supervision level`;
    }
    return details;
  }
}

export default UsIdHomeVisitTask;
