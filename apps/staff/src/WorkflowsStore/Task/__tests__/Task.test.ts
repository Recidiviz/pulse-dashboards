/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { parseISO } from "date-fns";
import { deleteField } from "firebase/firestore";
import { configure } from "mobx";
import tk from "timekeeper";

import FirestoreStore, { SupervisionTaskUpdate } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { JusticeInvolvedPerson } from "../../types";
import { homeVisitTaskRecord, supervisionTaskClientRecord } from "../fixtures";
import { SupervisionTask, SupervisionTaskType } from "../types";
import UsIdHomeVisitTask from "../UsIdHomeVisitTask";

jest.mock("../../subscriptions");
jest.mock("firebase/firestore");

let rootStore: RootStore;
let task: SupervisionTask<SupervisionTaskType>;
let mockPerson: JusticeInvolvedPerson;
let mockUpdates: SupervisionTaskUpdate[SupervisionTaskType] | undefined;

const testDate = "2023-05-18";

function createTestUnit(
  updates: SupervisionTaskUpdate[SupervisionTaskType] = mockUpdates,
) {
  rootStore = new RootStore();
  mockPerson = new Client(supervisionTaskClientRecord, rootStore);
  task = new UsIdHomeVisitTask(
    rootStore,
    homeVisitTaskRecord,
    mockPerson,
    updates,
  );
}

describe("Task", () => {
  beforeEach(() => {
    tk.freeze(testDate);
    jest.resetModules();
    configure({ safeDescriptors: false });
  });

  afterEach(() => {
    jest.resetAllMocks();
    configure({ safeDescriptors: true });
  });

  describe("Task without updates", () => {
    beforeEach(() => {
      createTestUnit();
    });

    test("type", () => {
      expect(task.type).toEqual("homeVisit");
    });

    test("dueDate", () => {
      expect(task.dueDate).toEqual(parseISO(homeVisitTaskRecord.dueDate));
    });

    test("isOverdue", () => {
      expect(task.isOverdue).toBeTrue();
    });

    test("dueDateFromToday", () => {
      expect(task.dueDateFromToday).toEqual("2 months ago");
    });

    test("details", () => {
      expect(task.details).toEqual(homeVisitTaskRecord.details);
    });

    test("snoozedUntil", () => {
      expect(task.snoozedUntil).toBeUndefined();
    });

    test("isSnoozed", () => {
      expect(task.isSnoozed).toBeFalse();
    });
  });

  describe("Task with updates", () => {
    beforeEach(() => {
      mockUpdates = {
        snoozedBy: "tester@test.org",
        snoozedOn: testDate,
        snoozeForDays: 30,
      };
      createTestUnit(mockUpdates);
    });
    test("snoozedUntil", () => {
      expect(task.snoozedUntil).toEqual(new Date(2023, 5, 17));
    });

    test("isSnoozed", () => {
      expect(task.isSnoozed).toBeTrue();
    });

    test("updateSupervisionTask with update", () => {
      jest.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: {
          email: "test@email.gov",
        },
      });
      jest.spyOn(FirestoreStore.prototype, "updateSupervisionTask");

      task.updateSupervisionTask(30);

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: {
          snoozeForDays: 30,
          snoozedBy: "test@email.gov",
          snoozedOn: testDate,
        },
      });
    });

    test("updateSupervisionTask undoing update", () => {
      jest.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: {
          email: "test@email.gov",
        },
      });
      jest.spyOn(FirestoreStore.prototype, "updateSupervisionTask");

      task.updateSupervisionTask(undefined);

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: deleteField(),
      });
    });
  });
});
