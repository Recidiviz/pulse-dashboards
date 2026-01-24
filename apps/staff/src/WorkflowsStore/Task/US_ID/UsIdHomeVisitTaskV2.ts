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

import { formatDate } from "../../../utils";
import UsIdTaskBase from "./UsIdTaskBase";

class UsIdHomeVisitTaskV2 extends UsIdTaskBase<"usIdHomeVisit"> {
  displayName = "Home Visit";
  taskAction = "home visit";

  get addressChangeDueDate() {
    const { addressChangeContactDueDate } = this.details;
    if (!addressChangeContactDueDate) return;
    return formatDate(fieldToDate(addressChangeContactDueDate));
  }

  get addressChangeDate() {
    const { addressChangeDate } = this.details;
    if (!addressChangeDate) return;
    return formatDate(fieldToDate(addressChangeDate));
  }

  get isAddressChanged() {
    if (!this.addressChangeDueDate) return false;
    return this.addressChangeDueDate === formatDate(this.dueDate);
  }

  get lastActionTaskText(): string | undefined {
    if (!this.lastContacted) return;
    if (this.isAddressChanged)
      return simplur`Address changed on ${this.addressChangeDate}.`;
    return super.lastActionTaskText;
  }
}

export default UsIdHomeVisitTaskV2;
