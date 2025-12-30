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

import { sortBy } from "lodash";

import { fieldToDate } from "~datatypes";

import { formatWorkflowsDate, toTitleCase } from "../../../utils";
import { Task } from "../Task";

class UsMoPositiveHomeVisitTask extends Task<"usMoPositiveHomeVisit"> {
  displayName = "Positive Home Visit";

  get supplementaryContacts() {
    const contacts = sortBy(this.details.supplementaryContacts, "contactDate");
    return contacts.map(
      (contact) =>
        `Home visit (${contact.contactTypes}) on ${formatWorkflowsDate(fieldToDate(contact.contactDate))}`,
    );
  }

  get additionalDetails() {
    const { lastContactDate } = this.details;
    return lastContactDate
      ? `Last positive home visit on ${formatWorkflowsDate(fieldToDate(lastContactDate))}`
      : "No previous positive home visit recorded during the current supervision level and/or case type.";
  }

  get frequency() {
    return toTitleCase(this.details.contactCadence);
  }
}

export default UsMoPositiveHomeVisitTask;
