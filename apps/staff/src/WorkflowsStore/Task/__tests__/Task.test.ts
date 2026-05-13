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

import { addDays, parseISO } from "date-fns";
import { deleteField } from "firebase/firestore";
import { configure } from "mobx";
import tk from "timekeeper";

import FirestoreStore, { SupervisionTaskUpdate } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { homeVisitTaskRecord, supervisionTaskClientRecord } from "../fixtures";
import { SupervisionTask, SupervisionTaskType } from "../types";
import UsIdHomeVisitTask from "../US_ID/UsIdHomeVisitTask";

vi.mock("../../subscriptions");
vi.mock("firebase/firestore");

let rootStore: RootStore;
let task: SupervisionTask<SupervisionTaskType>;
let mockPerson: Client;
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
    vi.resetModules();
    configure({ safeDescriptors: false });
  });

  afterEach(() => {
    vi.resetAllMocks();
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

    test("isOverdue is false before due date", () => {
      tk.freeze(addDays(task.dueDate, -1));
      expect(task.isOverdue).toBeFalse();
    });

    test("isOverdue is false on due date", () => {
      tk.freeze(task.dueDate);
      expect(task.isOverdue).toBeFalse();
    });

    test("isOverdue is false two days after due date", () => {
      tk.freeze(addDays(task.dueDate, 2));
      expect(task.isOverdue).toBeFalse();
    });

    test("isOverdue three days after due date", () => {
      tk.freeze(addDays(task.dueDate, 3));
      expect(task.isOverdue).toBeTrue();
    });

    test("dueDateFromToday", () => {
      expect(task.dueDateFromToday).toEqual("2 months ago");
    });

    test("details", () => {
      expect(task.details).toEqual(homeVisitTaskRecord.details);
    });

    test("snoozeInfo", () => {
      expect(task.snoozeInfo).toBeUndefined();
    });

    test("isSnoozed", () => {
      expect(task.isSnoozed).toBeFalse();
    });
  });

  describe("Task with snooze that expired in the past", () => {
    beforeEach(() => {
      mockUpdates = {
        snoozedBy: "tester@example.com",
        snoozedOn: "2000-01-01",
        snoozeForDays: 30,
      };
      createTestUnit(mockUpdates);
    });

    test("snoozeInfo contains details of a past snooze", () => {
      expect(task.snoozeInfo).not.toBeUndefined();
      expect(task.snoozeInfo?.snoozedBy).toEqual("tester@example.com");
      expect(task.snoozeInfo?.snoozedOn).toEqual("2000-01-01");
      expect(task.snoozeInfo?.snoozedUntil).toEqual(new Date(2000, 0, 31));
    });

    test("task is not snoozed", () => {
      expect(task.isSnoozed).toBeFalse();
    });
  });

  describe("Task with updates", () => {
    beforeEach(() => {
      mockUpdates = {
        snoozedBy: "tester@example.com",
        snoozedOn: testDate,
        snoozeForDays: 30,
      };
      createTestUnit(mockUpdates);
    });
    test("snoozeInfo", () => {
      expect(task.snoozeInfo).not.toBeUndefined();
      expect(task.snoozeInfo?.snoozedBy).toEqual("tester@example.com");
      expect(task.snoozeInfo?.snoozedOn).toEqual(testDate);
      expect(task.snoozeInfo?.snoozedUntil).toEqual(new Date(2023, 5, 17));
    });

    test("isSnoozed", () => {
      expect(task.isSnoozed).toBeTrue();
    });

    test("updateSupervisionTask with update", () => {
      vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: {
          email: "test@email.gov",
        },
      });
      vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");
      const trackSpy = vi.spyOn(rootStore.analyticsStore, "trackTaskSnoozed");

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
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({ snoozeForDays: 30, withReason: false }),
      );
    });

    test("updateSupervisionTask with update and snoozeReason", () => {
      vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: {
          email: "test@email.gov",
        },
      });
      vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");
      const trackSpy = vi.spyOn(rootStore.analyticsStore, "trackTaskSnoozed");

      task.updateSupervisionTask(30, "Client is currently moving.");

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: {
          snoozeForDays: 30,
          snoozedBy: "test@email.gov",
          snoozedOn: testDate,
          snoozeReason: "Client is currently moving.",
        },
      });
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({ snoozeForDays: 30, withReason: true }),
      );
    });

    test("updateSupervisionTask trims surrounding whitespace from snoozeReason", () => {
      vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: {
          email: "test@email.gov",
        },
      });
      vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");

      task.updateSupervisionTask(30, "  spaced reason  ");

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: {
          snoozeForDays: 30,
          snoozedBy: "test@email.gov",
          snoozedOn: testDate,
          snoozeReason: "spaced reason",
        },
      });
    });

    test.each([
      ["empty string", ""],
      ["whitespace-only string", "   "],
      ["undefined", undefined],
    ])(
      "updateSupervisionTask omits snoozeReason when reason is %s",
      (_label, reason) => {
        vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
          info: {
            email: "test@email.gov",
          },
        });
        vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");
        const trackSpy = vi.spyOn(rootStore.analyticsStore, "trackTaskSnoozed");

        task.updateSupervisionTask(30, reason);

        expect(
          rootStore.firestoreStore.updateSupervisionTask,
        ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
          homeVisit: {
            snoozeForDays: 30,
            snoozedBy: "test@email.gov",
            snoozedOn: testDate,
          },
        });
        expect(trackSpy).toHaveBeenCalledWith(
          expect.objectContaining({ snoozeForDays: 30, withReason: false }),
        );
      },
    );

    test("updateSupervisionTask undoing update", () => {
      vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: {
          email: "test@email.gov",
        },
      });
      vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");

      task.updateSupervisionTask(undefined);

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: deleteField(),
      });
    });

    test("updateSupervisionTask ignores reason when undoing", () => {
      vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: {
          email: "test@email.gov",
        },
      });
      vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");

      task.updateSupervisionTask(undefined, "ignored reason");

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: deleteField(),
      });
    });
  });

  describe("Task with snooze update including a reason", () => {
    beforeEach(() => {
      mockUpdates = {
        snoozedBy: "tester@example.com",
        snoozedOn: testDate,
        snoozeForDays: 30,
        snoozeReason: "Client is currently moving.",
      };
      createTestUnit(mockUpdates);
    });

    test("snoozeInfo surfaces the snoozeReason", () => {
      expect(task.snoozeInfo).not.toBeUndefined();
      expect(task.snoozeInfo?.snoozeReason).toEqual(
        "Client is currently moving.",
      );
    });
  });

  describe("Task with FOREVER snooze and tasksPermasnooze ON", () => {
    beforeEach(() => {
      mockUpdates = {
        snoozedBy: "tester@example.com",
        snoozedOn: testDate,
        snoozeForDays: "FOREVER",
      };
      createTestUnit(mockUpdates);
      vi.spyOn(
        rootStore.workflowsStore,
        "featureVariants",
        "get",
      ).mockReturnValue({ tasksPermasnooze: {} });
    });

    test("snoozeInfo carries snoozedUntil = FOREVER and preserves metadata", () => {
      expect(task.snoozeInfo).not.toBeUndefined();
      expect(task.snoozeInfo?.snoozedBy).toEqual("tester@example.com");
      expect(task.snoozeInfo?.snoozedOn).toEqual(testDate);
      expect(task.snoozeInfo?.snoozedUntil).toEqual("FOREVER");
    });

    test("isSnoozed is true for a FOREVER snooze", () => {
      expect(task.isSnoozed).toBeTrue();
    });

    test("isSnoozed remains true for a FOREVER snooze with an old snoozedOn", () => {
      mockUpdates = {
        snoozedBy: "tester@example.com",
        snoozedOn: "2000-01-01",
        snoozeForDays: "FOREVER",
      };
      createTestUnit(mockUpdates);
      vi.spyOn(
        rootStore.workflowsStore,
        "featureVariants",
        "get",
      ).mockReturnValue({ tasksPermasnooze: {} });
      expect(task.isSnoozed).toBeTrue();
    });

    test("snoozeInfo surfaces a snoozeReason alongside FOREVER", () => {
      mockUpdates = {
        snoozedBy: "tester@example.com",
        snoozedOn: testDate,
        snoozeForDays: "FOREVER",
        snoozeReason: "Client is retired.",
      };
      createTestUnit(mockUpdates);
      vi.spyOn(
        rootStore.workflowsStore,
        "featureVariants",
        "get",
      ).mockReturnValue({ tasksPermasnooze: {} });
      expect(task.snoozeInfo?.snoozedUntil).toEqual("FOREVER");
      expect(task.snoozeInfo?.snoozeReason).toEqual("Client is retired.");
    });

    test("updateSupervisionTask writes FOREVER as snoozeForDays", () => {
      vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: { email: "test@email.gov" },
      });
      vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");
      const trackSpy = vi.spyOn(rootStore.analyticsStore, "trackTaskSnoozed");

      task.updateSupervisionTask("FOREVER");

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: {
          snoozeForDays: "FOREVER",
          snoozedBy: "test@email.gov",
          snoozedOn: testDate,
        },
      });
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          snoozeForDays: "FOREVER",
          withReason: false,
        }),
      );
    });

    test("updateSupervisionTask writes FOREVER with a snoozeReason", () => {
      vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: { email: "test@email.gov" },
      });
      vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");
      const trackSpy = vi.spyOn(rootStore.analyticsStore, "trackTaskSnoozed");

      task.updateSupervisionTask("FOREVER", "Client is retired.");

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: {
          snoozeForDays: "FOREVER",
          snoozedBy: "test@email.gov",
          snoozedOn: testDate,
          snoozeReason: "Client is retired.",
        },
      });
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          snoozeForDays: "FOREVER",
          withReason: true,
        }),
      );
    });

    test("updateSupervisionTask(undefined) clears a FOREVER snooze via deleteField", () => {
      vi.spyOn(rootStore.userStore, "user", "get").mockReturnValue({
        info: { email: "test@email.gov" },
      });
      vi.spyOn(FirestoreStore.prototype, "updateSupervisionTask");

      task.updateSupervisionTask(undefined);

      expect(
        rootStore.firestoreStore.updateSupervisionTask,
      ).toHaveBeenCalledWith(supervisionTaskClientRecord.recordId, {
        homeVisit: deleteField(),
      });
    });
  });

  describe("Task with FOREVER snooze and tasksPermasnooze OFF", () => {
    beforeEach(() => {
      mockUpdates = {
        snoozedBy: "tester@example.com",
        snoozedOn: testDate,
        snoozeForDays: "FOREVER",
      };
      createTestUnit(mockUpdates);
      // No featureVariants override — the flag defaults to off in tests.
    });

    test("snoozeInfo returns undefined for a FOREVER record when the flag is off", () => {
      expect(task.snoozeInfo).toBeUndefined();
    });

    test("isSnoozed is false for a FOREVER record when the flag is off", () => {
      expect(task.isSnoozed).toBeFalse();
    });

    test("flipping the flag on makes the same record snoozed again", () => {
      expect(task.isSnoozed).toBeFalse();
      vi.spyOn(
        rootStore.workflowsStore,
        "featureVariants",
        "get",
      ).mockReturnValue({ tasksPermasnooze: {} });
      expect(task.isSnoozed).toBeTrue();
      expect(task.snoozeInfo?.snoozedUntil).toEqual("FOREVER");
    });

    test("numeric snoozes are unaffected by the flag", () => {
      mockUpdates = {
        snoozedBy: "tester@example.com",
        snoozedOn: testDate,
        snoozeForDays: 30,
      };
      createTestUnit(mockUpdates);
      expect(task.isSnoozed).toBeTrue();
      expect(task.snoozeInfo?.snoozedUntil).toEqual(new Date(2023, 5, 17));
    });
  });
});
