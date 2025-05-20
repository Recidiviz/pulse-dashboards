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

import { capitalize } from "lodash";

import { generateSerialListString } from "../../utils";
import { Task } from "./Task";

class UsTxTypeAgnosticContactTask extends Task<"usTxTypeAgnosticContact"> {
  get displayName() {
    return this.allowedContactTypes;
  }

  get allowedContactTypes(): string {
    const rawTypes = this.details.officerInCriticallyUnderstaffedLocation
      ? this.details.overrideContactTypesAccepted
      : this.details.contactTypesAccepted;
    const allowedTypes = (rawTypes ?? "Contact")
      .split(",")
      .map((type) => type.toLowerCase());

    allowedTypes[0] = capitalize(allowedTypes[0]);

    return generateSerialListString(allowedTypes, "or");
  }

  get additionalDetails(): string {
    return this.details.lastContactDate
      ? `Last contact: ${this.details.lastContactDate}`
      : "No previous visit on record";
  }

  get frequency(): string {
    return `Every ${this.details.frequency.toLowerCase()}`;
  }
}

export default UsTxTypeAgnosticContactTask;
