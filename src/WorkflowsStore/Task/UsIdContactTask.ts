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

import { Task } from "./Task";
import { US_ID_SUPERVISION_LEVEL_CONTACT_COMPLIANCE } from "./utils";

class UsIdContactTask extends Task<"contact"> {
  displayName = "Contact";

  dueDateDisplayLong = `${this.displayName} recommended ${this.dueDateFromToday}`;

  dueDateDisplayShort = `Recommended ${this.dueDateFromToday}`;

  get supervisionLevel(): string | undefined {
    return this.details.supervisionLevel;
  }

  get additionalDetails(): string | undefined {
    // TODO: Add the last contact date when available in data: Last home contact on MM/DD/YYYY
    if (!this.supervisionLevel) return;
    return simplur`${
      US_ID_SUPERVISION_LEVEL_CONTACT_COMPLIANCE[this.supervisionLevel].contacts
    } contact[|s] needed every ${
      US_ID_SUPERVISION_LEVEL_CONTACT_COMPLIANCE[this.supervisionLevel].days
    } days, for current supervision level`;
  }
}

export default UsIdContactTask;
