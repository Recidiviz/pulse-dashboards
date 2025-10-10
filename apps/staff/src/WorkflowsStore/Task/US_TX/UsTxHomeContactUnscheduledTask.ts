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

import { toTitleCase } from "../../../utils/formatStrings";
import UsTxContactTask from "./UsTxContactTask";

class UsTxHomeContactUnscheduledTask extends UsTxContactTask<"usTxHomeContactUnscheduled"> {
  get displayName(): string {
    if (this.details.officerInCriticallyUnderstaffedLocation) {
      // Fallthrough to the final return is intentional
      switch (this.details.overrideContactType) {
        case "UNSCHEDULED HOME (VIRTUAL)":
          return "Home Contact (Unscheduled, Virtual)";
      }
    }

    return "Home Contact (Unscheduled)";
  }

  get frequency(): string {
    return toTitleCase(this.details.contactCadence);
  }
}

export default UsTxHomeContactUnscheduledTask;
