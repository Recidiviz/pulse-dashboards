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

import { Client } from "../../Client";
import UsTxContactTask from "./UsTxContactTask";

class UsTxHomeContactUnscheduledTask extends UsTxContactTask<"usTxHomeContactUnscheduled"> {
  get displayName(): string {
    if (this.details.officerInCriticallyUnderstaffedLocation) {
      // Fallthrough to the final return is intentional
      switch (this.details.overrideContactType) {
        case "UNSCHEDULED HOME (VIRTUAL)":
          return "Virtual contact in lieu of home visit (unscheduled)";
      }
    }

    return "Home contact (unscheduled)";
  }

  get frequency(): string {
    const client = this.person as Client;
    const high = client.supervisionLevel === "High";
    const moderate = client.supervisionLevel === "Moderate";
    const so = client.caseTypeRawText === "SEX OFFENDER";
    const sisp = client.caseTypeRawText === "SUPER-INTENSIVE SUPERVISION";
    if ((high && so) || (high && sisp) || (moderate && sisp)) {
      return "Twice per month";
    }
    return super.frequency;
  }
}

export default UsTxHomeContactUnscheduledTask;
