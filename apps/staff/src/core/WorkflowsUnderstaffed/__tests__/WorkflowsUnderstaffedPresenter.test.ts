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

import { StaffRecord } from "~datatypes";

import { Officer } from "../../../WorkflowsStore/Officer";
import { SearchStore } from "../../../WorkflowsStore/SearchStore";
import { WorkflowsUnderstaffedPresenter } from "../WorkflowsUnderstaffedPresenter";

function generateOfficerRecord(
  recordType: "supervisionStaff" | "incarcerationStaff",
  stateSpecificData: undefined | Record<string, unknown> = undefined,
): Officer {
  if (stateSpecificData === undefined) {
    return new Officer({
      recordType,
    } as StaffRecord);
  }

  return new Officer({
    recordType,
    stateSpecificData,
  } as StaffRecord);
}

describe("WorkflowsUnderstaffedPresenter", () => {
  describe("understaffedOfficerSelected", () => {
    it("returns true if any selected officers are in an understaffed office", () => {
      const searchStore = {
        selectedSearchables: [
          generateOfficerRecord("supervisionStaff", {
            isInUnderstaffedOffice: false,
          }),
          generateOfficerRecord("supervisionStaff", {
            isInUnderstaffedOffice: true,
          }),
        ],
      } as unknown as SearchStore;
      const presenter = new WorkflowsUnderstaffedPresenter(searchStore);
      expect(presenter.understaffedOfficerSelected).toBe(true);
    });

    it("returns false if no selected officers are in an understaffed office", () => {
      const searchStore = {
        selectedSearchables: [
          generateOfficerRecord("supervisionStaff", {
            isInUnderstaffedOffice: false,
          }),
          generateOfficerRecord("supervisionStaff", {
            isInUnderstaffedOffice: false,
          }),
        ],
      } as unknown as SearchStore;
      const presenter = new WorkflowsUnderstaffedPresenter(searchStore);
      expect(presenter.understaffedOfficerSelected).toBe(false);
    });

    it("returns false if the searchables are not supervision officers", () => {
      const searchStore = {
        selectedSearchables: [
          {
            record: {
              recordType: "incarcerationStaff",
            },
          },
          {
            record: {
              recordType: "location",
            },
          },
        ],
      } as unknown as SearchStore;
      const presenter = new WorkflowsUnderstaffedPresenter(searchStore);
      expect(presenter.understaffedOfficerSelected).toBe(false);
    });
  });
});
