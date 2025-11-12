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

import { fieldToDate, toDateList } from "~datatypes";

import { formatWorkflowsDate, generateSerialListString } from "../../../utils";
import { toTitleCase } from "../../../utils/formatStrings";
import { Task } from "../Task";
import { UsTxAgnosticContactTaskType } from "../types";

class UsTxTypeAgnosticContactTask<
  T extends UsTxAgnosticContactTaskType,
> extends Task<T> {
  get displayName() {
    return this.allowedContactTypes;
  }

  get allowedContactTypes(): string {
    const rawTypes = this.details.officerInCriticallyUnderstaffedLocation
      ? this.details.overrideContactTypesAccepted
      : this.details.contactTypesAccepted;
    const allowedTypes = (rawTypes ?? "Contact")
      .split(",")
      .map((type) => toTitleCase(type));

    allowedTypes[0] = toTitleCase(allowedTypes[0]);

    return generateSerialListString(allowedTypes, "or");
  }

  get lastContactDate(): string | undefined {
    if (!this.details.lastContactDate) return;
    return formatWorkflowsDate(fieldToDate(this.details.lastContactDate));
  }

  get additionalDetails(): string {
    return this.details.lastContactDate
      ? `Last contact: ${this.lastContactDate}`
      : "No previous visit on record";
  }

  get frequency(): string {
    return toTitleCase(this.details.contactCadence);
  }

  get scheduledContactDates() {
    if (!this.details.scheduledContactDates) return;
    return toDateList(this.details.scheduledContactDates);
  }
}

export default UsTxTypeAgnosticContactTask;
