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

import { toDateList } from "~datatypes";

import {
  formatWorkflowsDateString,
  toTitleCase,
} from "../../../utils/formatStrings";
import { Task } from "../Task";

const EDGE_CASE_TRIGGER_LABELS: Record<string, string> = {
  US_TX_MEETS_ADDRESS_CHANGE_HOME_CONTACT_TRIGGER: "Address change date",
  US_TX_MEETS_INITIAL_HOME_CONTACT_TRIGGER: "Initial contact date",
  US_TX_MEETS_RETURN_FROM_CUSTODY_HOME_CONTACT_TRIGGER:
    "Return from custody date",
};

class UsTxHomeContactEdgeCaseTask extends Task<"usTxHomeContactEdgeCase"> {
  vitalsMetricId = "timely_contact_due_date_based" as const;

  get additionalDetails(): string {
    const trigger =
      EDGE_CASE_TRIGGER_LABELS[this.details.criteriaName] ?? "Event Date";
    return `${trigger}: ${formatWorkflowsDateString(this.details.causalDate)}`;
  }

  get frequency(): string {
    return toTitleCase(this.details.contactCadence);
  }

  get scheduledContactDates() {
    if (!this.details.scheduledContactDates) return [];
    return toDateList(this.details.scheduledContactDates);
  }
}

export default UsTxHomeContactEdgeCaseTask;
