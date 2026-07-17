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

import {
  formatWorkflowsDate,
  formatWorkflowsDateString,
  toTitleCase,
} from "../../../utils/formatStrings";
import { Task } from "../Task";

class UsTxNewArrivalContactTask extends Task<"usTxNewArrivalContact"> {
  vitalsMetricId = "timely_contact_due_date_based" as const;

  get getDisplayName(): string {
    return "New Arrival (Scheduled Field Contact)";
  }

  get lastContactDate(): string | undefined {
    if (!this.details.lastContactDate) return;
    return formatWorkflowsDate(fieldToDate(this.details.lastContactDate));
  }

  get additionalDetails(): string {
    const arrivalDate = `Arrival date: ${formatWorkflowsDateString(
      this.details.causalDate,
    )}`;
    const lastContact = this.lastContactDate
      ? `Last contact: ${this.lastContactDate}`
      : "No previous contact on record";
    return `${arrivalDate} • ${lastContact}`;
  }

  get frequency(): string {
    return toTitleCase(this.details.contactCadence);
  }
}

export default UsTxNewArrivalContactTask;
