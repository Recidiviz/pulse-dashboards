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

import simplur from "simplur";

import { fieldToDate } from "~datatypes";

import { formatDate, toTitleCase } from "../../../utils";
import { Task } from "../Task";
import { UsIdAgnosticTaskType } from "../types";

abstract class UsIdTaskBase<T extends UsIdAgnosticTaskType> extends Task<T> {
  abstract taskAction: string;

  get lastContacted(): string | undefined {
    const { lastContactDate } = this.details;
    if (!lastContactDate) return;
    return formatDate(fieldToDate(lastContactDate));
  }

  get lastActionTaskText(): string | undefined {
    if (!this.lastContacted) return;
    return simplur`Last ${this.taskAction} on ${this.lastContacted}.`;
  }

  get frequency() {
    const { contactCadence } = this.details;
    if (!contactCadence) return "";
    return toTitleCase(contactCadence.toLowerCase()).replace("Lsir", "LSIR");
  }

  /* ex: Risk assessment due 3 days ago */
  get dueDateDisplayLong() {
    return `${this.displayName} due ${this.dueDateFromToday}`;
  }

  /* ex: Due 3 days ago */
  get dueDateDisplayShort() {
    return `Due ${this.dueDateFromToday}`;
  }

  get additionalDetails(): string {
    const { lastActionTaskText } = this;
    if (lastActionTaskText) return lastActionTaskText;
    else return `No previous ${this.displayName.toLowerCase()} on record.`;
  }
}

export default UsIdTaskBase;
