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

import { RootStore } from "../../../RootStore";
import { formatWorkflowsDateString } from "../../../utils/formatStrings";
import { Client } from "../../Client";
import { SupervisionTaskRecord } from "../types";
import UsTxHomeContactEdgeCaseTask from "../US_TX/UsTxHomeContactEdgeCaseTask";

const mockPerson = {} as Client;
const mockRootStore = {} as RootStore;

function makeTask(
  criteriaName: string,
  causalDate = "2026-06-09",
): UsTxHomeContactEdgeCaseTask {
  const mockTaskRecord = {
    type: "usTxHomeContactEdgeCase",
    details: {
      contactCadence: "1 EVERY 3 MONTHS",
      scheduledContactDates: null,
      causalDate,
      criteriaName,
    },
    dueDate: "2026-06-30",
  } as SupervisionTaskRecord<"usTxHomeContactEdgeCase">;
  return new UsTxHomeContactEdgeCaseTask(
    mockRootStore,
    mockTaskRecord,
    mockPerson,
  );
}

describe("UsTxHomeContactEdgeCaseTask", () => {
  describe("additionalDetails", () => {
    const expectedDate = formatWorkflowsDateString("2026-06-09");

    test.each([
      [
        "US_TX_MEETS_ADDRESS_CHANGE_HOME_CONTACT_TRIGGER",
        "Address change date",
      ],
      ["US_TX_MEETS_INITIAL_HOME_CONTACT_TRIGGER", "Initial contact date"],
      [
        "US_TX_MEETS_RETURN_FROM_CUSTODY_HOME_CONTACT_TRIGGER",
        "Return from custody date",
      ],
    ])("renders mapped trigger %s with event date", (criteriaName, label) => {
      const task = makeTask(criteriaName);
      expect(task.additionalDetails).toEqual(`${label}: ${expectedDate}`);
    });

    test('falls back to "Event Date" when the trigger is unmapped', () => {
      const task = makeTask("US_TX_SOME_FUTURE_HOME_CONTACT_TRIGGER");
      expect(task.additionalDetails).toEqual(`Event Date: ${expectedDate}`);
    });
  });
});
