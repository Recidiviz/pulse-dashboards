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

import { makeAutoObservable } from "mobx";

import { Officer } from "../../WorkflowsStore/Officer";
import { SearchStore } from "../../WorkflowsStore/SearchStore";

export class WorkflowsUnderstaffedPresenter {
  constructor(private searchStore: SearchStore) {
    makeAutoObservable(this);
  }

  // Returns true if any selected officers are in an understaffed office
  get understaffedOfficerSelected() {
    return this.searchStore.selectedSearchables.some((searchable) => {
      if (!(searchable instanceof Officer)) return false;

      return (
        searchable.record.recordType === "supervisionStaff" &&
        searchable.record?.stateSpecificData?.isInUnderstaffedOffice
      );
    });
  }
}
