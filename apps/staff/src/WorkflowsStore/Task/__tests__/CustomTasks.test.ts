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

import { Timestamp } from "firebase/firestore";
import { configure } from "mobx";
import tk from "timekeeper";
import { Mock } from "vitest";

import { CustomTaskRecord } from "../../../FirestoreStore";
import { CustomTasksSubscription } from "../../subscriptions/CustomTasksSubscription";
import { CustomTasks } from "../CustomTasks";

vi.mock("../../subscriptions/CustomTasksSubscription");

const RECORD_ID = "us_mo_123";
const PSEUDO_ID = "pseudo-us_mo_123";
const USER_EMAIL = "officer@recidiviz.org";
const FROZEN_NOW = new Date("2026-05-14T12:00:00.000Z");

const CustomTasksSubscriptionMock = vi.mocked(CustomTasksSubscription);

function makeRecord(
  overrides: Partial<CustomTaskRecord> = {},
): CustomTaskRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Default title",
    dueDate: new Date("2026-06-01"),
    createdOn: new Date("2026-05-14"),
    recurrence: null,
    deletedOn: null,
    stateCode: "us_mo",
    ...overrides,
  };
}

let firestoreStoreMock: {
  createCustomTask: Mock;
  updateCustomTask: Mock;
  softDeleteCustomTask: Mock;
};
let analyticsStoreMock: {
  trackCustomTaskCreated: Mock;
  trackCustomTaskCompleted: Mock;
  trackCustomTaskDeleted: Mock;
};
let rootStoreMock: any;
let personMock: any;
let customTasks: CustomTasks;
let subscriptionInstance: {
  data: CustomTaskRecord[];
  hydrate: Mock;
  unsubscribe: Mock;
  hydrationState: any;
};

beforeEach(() => {
  configure({ safeDescriptors: false });
  tk.freeze(FROZEN_NOW);

  subscriptionInstance = {
    data: [],
    hydrate: vi.fn(),
    unsubscribe: vi.fn(),
    hydrationState: { status: "needs hydration" } as const,
  };
  CustomTasksSubscriptionMock.mockImplementation(
    () => subscriptionInstance as unknown as CustomTasksSubscription,
  );

  firestoreStoreMock = {
    createCustomTask: vi.fn().mockResolvedValue("new-task-id"),
    updateCustomTask: vi.fn().mockResolvedValue(undefined),
    softDeleteCustomTask: vi.fn().mockResolvedValue(undefined),
  };
  analyticsStoreMock = {
    trackCustomTaskCreated: vi.fn(),
    trackCustomTaskCompleted: vi.fn(),
    trackCustomTaskDeleted: vi.fn(),
  };
  rootStoreMock = {
    firestoreStore: firestoreStoreMock,
    analyticsStore: analyticsStoreMock,
    userStore: { userEmail: USER_EMAIL },
  };
  personMock = { recordId: RECORD_ID, pseudonymizedId: PSEUDO_ID };

  customTasks = new CustomTasks(rootStoreMock, personMock);
});

afterEach(() => {
  vi.resetAllMocks();
  configure({ safeDescriptors: true });
  tk.reset();
});

describe("CustomTasks", () => {
  describe("constructor", () => {
    test("instantiates a CustomTasksSubscription with the record id", () => {
      expect(CustomTasksSubscriptionMock).toHaveBeenCalledWith(
        firestoreStoreMock,
        RECORD_ID,
      );
    });
  });

  describe("hydration", () => {
    test("hydrate() forwards to the subscription", () => {
      customTasks.hydrate();
      expect(subscriptionInstance.hydrate).toHaveBeenCalledTimes(1);
    });

    test("hydrationState reflects the subscription's state", () => {
      expect(customTasks.hydrationState).toEqual({ status: "needs hydration" });

      subscriptionInstance.hydrationState = { status: "hydrated" };
      expect(customTasks.hydrationState).toEqual({ status: "hydrated" });
    });
  });

  describe("retry", () => {
    test("on a 'failed' subscription, unsubscribes, resets state, and re-hydrates", () => {
      subscriptionInstance.hydrationState = {
        status: "failed",
        error: new Error("listener failed"),
      };

      customTasks.retry();

      expect(subscriptionInstance.unsubscribe).toHaveBeenCalledTimes(1);
      expect(subscriptionInstance.hydrationState).toEqual({
        status: "needs hydration",
      });
      expect(subscriptionInstance.hydrate).toHaveBeenCalledTimes(1);
    });

    test("is a no-op when the subscription is not in 'failed'", () => {
      subscriptionInstance.hydrationState = { status: "hydrated" };

      customTasks.retry();

      expect(subscriptionInstance.unsubscribe).not.toHaveBeenCalled();
      expect(subscriptionInstance.hydrate).not.toHaveBeenCalled();
      expect(subscriptionInstance.hydrationState).toEqual({
        status: "hydrated",
      });
    });
  });

  describe("orderedTasks", () => {
    test("returns an empty array when the subscription has no data", () => {
      expect(customTasks.orderedTasks).toEqual([]);
    });

    test("sorts active tasks ascending by dueDate, then completed tasks ascending by dueDate", () => {
      const activeLate = makeRecord({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "Active late",
        dueDate: new Date("2026-08-01"),
      });
      const activeEarly = makeRecord({
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        title: "Active early",
        dueDate: new Date("2026-06-01"),
      });
      const completedLate = makeRecord({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        title: "Completed late",
        dueDate: new Date("2026-07-01"),
        completedOn: new Date("2026-07-02"),
      });
      const completedEarly = makeRecord({
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        title: "Completed early",
        dueDate: new Date("2026-05-01"),
        completedOn: new Date("2026-05-02"),
      });

      subscriptionInstance.data = [
        completedLate,
        activeLate,
        activeEarly,
        completedEarly,
      ];

      expect(customTasks.orderedTasks.map((t) => t.title)).toEqual([
        "Active early",
        "Active late",
        "Completed early",
        "Completed late",
      ]);
    });

    test("sorts Timestamp-valued dueDates correctly alongside Date-valued ones", () => {
      const tsDue = makeRecord({
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        title: "Timestamp due",
        dueDate: Timestamp.fromDate(new Date("2026-06-15")),
      });
      const dateDue = makeRecord({
        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        title: "Date due",
        dueDate: new Date("2026-06-10"),
      });
      subscriptionInstance.data = [tsDue, dateDue];

      expect(customTasks.orderedTasks.map((t) => t.title)).toEqual([
        "Date due",
        "Timestamp due",
      ]);
    });
  });

  describe("addCustomTask", () => {
    test("calls FirestoreStore.createCustomTask with the record id, the title, and a Timestamp due date", async () => {
      const due = new Date("2026-07-04");
      await customTasks.addCustomTask({
        title: "Pickup paperwork",
        dueDate: due,
      });

      expect(firestoreStoreMock.createCustomTask).toHaveBeenCalledTimes(1);
      const [calledRecordId, input] =
        firestoreStoreMock.createCustomTask.mock.calls[0];
      expect(calledRecordId).toBe(RECORD_ID);
      expect(input.title).toBe("Pickup paperwork");
      expect(input.dueDate).toBeInstanceOf(Timestamp);
      expect((input.dueDate as Timestamp).toMillis()).toBe(due.getTime());
    });

    test("passes through a Timestamp dueDate unchanged", async () => {
      const due = Timestamp.fromDate(new Date("2026-07-04"));
      await customTasks.addCustomTask({ title: "x", dueDate: due });

      const [, input] = firestoreStoreMock.createCustomTask.mock.calls[0];
      expect(input.dueDate).toBe(due);
    });

    test("fires custom_task_created analytics with the new taskId", async () => {
      await customTasks.addCustomTask({
        title: "x",
        dueDate: new Date("2026-07-04"),
      });

      expect(analyticsStoreMock.trackCustomTaskCreated).toHaveBeenCalledWith({
        justiceInvolvedPersonId: PSEUDO_ID,
        taskId: "new-task-id",
      });
    });

    test("omitting recurrence persists null (one-off task)", async () => {
      await customTasks.addCustomTask({
        title: "One-off",
        dueDate: new Date("2026-07-04"),
      });
      const [, input] = firestoreStoreMock.createCustomTask.mock.calls[0];
      expect(input.recurrence).toBeNull();
    });

    test("passes a recurrence RRULE string through to the firestore write", async () => {
      await customTasks.addCustomTask({
        title: "Weekly",
        dueDate: new Date("2026-07-04"),
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
      });
      const [, input] = firestoreStoreMock.createCustomTask.mock.calls[0];
      expect(input.recurrence).toBe("FREQ=WEEKLY;BYDAY=FR");
    });
  });

  describe("editCustomTask", () => {
    test("calls FirestoreStore.updateCustomTask with only the supplied fields", async () => {
      await customTasks.editCustomTask("task-1", { title: "New title" });

      expect(firestoreStoreMock.updateCustomTask).toHaveBeenCalledWith(
        RECORD_ID,
        "task-1",
        { title: "New title" },
      );
    });

    test("normalizes a Date dueDate to a Timestamp in the patch", async () => {
      const due = new Date("2026-08-01");
      await customTasks.editCustomTask("task-2", { dueDate: due });

      const [, , patch] = firestoreStoreMock.updateCustomTask.mock.calls[0];
      expect(Object.keys(patch)).toEqual(["dueDate"]);
      expect(patch.dueDate).toBeInstanceOf(Timestamp);
      expect((patch.dueDate as Timestamp).toMillis()).toBe(due.getTime());
    });

    test("supports both fields in a single patch", async () => {
      const due = Timestamp.fromDate(new Date("2026-09-01"));
      await customTasks.editCustomTask("task-3", {
        title: "Both",
        dueDate: due,
      });

      const [, , patch] = firestoreStoreMock.updateCustomTask.mock.calls[0];
      expect(patch).toEqual({ title: "Both", dueDate: due });
    });

    test("threads a recurrence RRULE through the patch when supplied", async () => {
      await customTasks.editCustomTask("task-4", {
        recurrence: "FREQ=MONTHLY;BYMONTHDAY=18",
      });
      const [, , patch] = firestoreStoreMock.updateCustomTask.mock.calls[0];
      expect(patch).toEqual({ recurrence: "FREQ=MONTHLY;BYMONTHDAY=18" });
    });

    test("explicit recurrence=null clears the RRULE on an existing recurring task", async () => {
      await customTasks.editCustomTask("task-5", { recurrence: null });
      const [, , patch] = firestoreStoreMock.updateCustomTask.mock.calls[0];
      expect(patch).toEqual({ recurrence: null });
    });
  });

  describe("toggleCustomTaskCompleted", () => {
    test("stamps a Timestamp completedOn on transition to true", async () => {
      await customTasks.toggleCustomTaskCompleted("task-1", true);

      expect(firestoreStoreMock.updateCustomTask).toHaveBeenCalledTimes(1);
      const [recordId, taskId, patch] =
        firestoreStoreMock.updateCustomTask.mock.calls[0];
      expect(recordId).toBe(RECORD_ID);
      expect(taskId).toBe("task-1");
      expect(patch.completedOn).toBeInstanceOf(Timestamp);
      expect((patch.completedOn as Timestamp).toMillis()).toBe(
        FROZEN_NOW.getTime(),
      );
    });

    test("nulls completedOn on transition to false", async () => {
      await customTasks.toggleCustomTaskCompleted("task-2", false);

      const [, , patch] = firestoreStoreMock.updateCustomTask.mock.calls[0];
      expect(patch).toEqual({ completedOn: null });
    });

    test("fires custom_task_completed analytics for both directions", async () => {
      await customTasks.toggleCustomTaskCompleted("task-1", true);
      expect(
        analyticsStoreMock.trackCustomTaskCompleted,
      ).toHaveBeenLastCalledWith({
        justiceInvolvedPersonId: PSEUDO_ID,
        taskId: "task-1",
        completed: true,
      });

      await customTasks.toggleCustomTaskCompleted("task-1", false);
      expect(
        analyticsStoreMock.trackCustomTaskCompleted,
      ).toHaveBeenLastCalledWith({
        justiceInvolvedPersonId: PSEUDO_ID,
        taskId: "task-1",
        completed: false,
      });
    });
  });

  describe("deleteCustomTask", () => {
    test("calls FirestoreStore.softDeleteCustomTask", async () => {
      await customTasks.deleteCustomTask("task-1");

      expect(firestoreStoreMock.softDeleteCustomTask).toHaveBeenCalledWith(
        RECORD_ID,
        "task-1",
      );
    });

    test("fires custom_task_deleted analytics", async () => {
      await customTasks.deleteCustomTask("task-1");

      expect(analyticsStoreMock.trackCustomTaskDeleted).toHaveBeenCalledWith({
        justiceInvolvedPersonId: PSEUDO_ID,
        taskId: "task-1",
      });
    });
  });

  describe("activeTaskItems", () => {
    test("non-recurring task due in the future is active and not overdue", () => {
      const record = makeRecord({
        id: "future-1",
        title: "Future task",
        dueDate: new Date("2026-06-01"),
      });
      subscriptionInstance.data = [record];

      const items = customTasks.activeTaskItems;
      expect(items).toHaveLength(1);
      const [item] = items;
      expect(item.type).toBe("customTask");
      expect(item.key).toBe(record.id);
      expect(item.displayName).toBe(record.title);
      expect(item.isOverdue).toBe(false);
      expect(item.isSnoozed).toBe(false);
      expect(item.frequency).toBe("One-time");
    });

    test("non-recurring task with a dueDate in the past is overdue", () => {
      const record = makeRecord({
        id: "past-1",
        title: "Past task",
        dueDate: new Date("2026-01-01"),
      });
      subscriptionInstance.data = [record];

      const [item] = customTasks.activeTaskItems;
      expect(item.isOverdue).toBe(true);
    });

    test("non-recurring task due today (frozen now) is not overdue", () => {
      const record = makeRecord({
        id: "today-1",
        title: "Today task",
        dueDate: FROZEN_NOW,
      });
      subscriptionInstance.data = [record];

      const [item] = customTasks.activeTaskItems;
      expect(item.isOverdue).toBe(false);
    });

    test("completed non-recurring task is excluded", () => {
      subscriptionInstance.data = [
        makeRecord({
          id: "done-1",
          title: "Done task",
          dueDate: new Date("2026-06-01"),
          completedOn: FROZEN_NOW,
        }),
      ];

      expect(customTasks.activeTaskItems).toEqual([]);
    });

    test("recurring weekly task never completed resolves to the most-recent past occurrence", () => {
      const record = makeRecord({
        id: "weekly-1",
        title: "Weekly Friday",
        // 2025-11-14 is a Friday.
        dueDate: new Date("2025-11-14"),
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
      });
      subscriptionInstance.data = [record];

      const [item] = customTasks.activeTaskItems;
      // Most recent Friday at-or-before 2026-05-14 (Thursday) is 2026-05-08.
      expect(item.dueDate.toISOString()).toBe("2026-05-08T00:00:00.000Z");
      expect(item.isOverdue).toBe(true);
      // From `describeRecurrence` via rrule.toText().
      expect(item.frequency).toBe("every week on Friday");
    });

    test("recurring task previously completed with the next cycle still in the future is excluded", () => {
      // Anchor + completedOn pre-date frozen now; the rrule.after(completedOn)
      // call returns a Friday that is still > now, so isTaskCompleted -> true
      // and activeTaskItems filters it out.
      const record = makeRecord({
        id: "weekly-completed-recent",
        title: "Weekly recent",
        dueDate: new Date("2025-11-14"),
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
        // Last Friday before frozen now is 2026-05-08; mark completed then.
        // The next occurrence after 2026-05-08 is 2026-05-15, which is > now,
        // so the task is considered completed for the current cycle.
        completedOn: new Date("2026-05-08T13:00:00.000Z"),
      });
      subscriptionInstance.data = [record];

      expect(customTasks.activeTaskItems).toEqual([]);
    });

    test("recurring task previously completed with the cycle rolled over is active", () => {
      const record = makeRecord({
        id: "weekly-completed-long-ago",
        title: "Weekly old completion",
        dueDate: new Date("2025-11-14"),
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
        // Completed in early December 2025; many Fridays have elapsed since,
        // so the next-after-completedOn is in the past and the task has
        // rolled over.
        completedOn: new Date("2025-12-01"),
      });
      subscriptionInstance.data = [record];

      const items = customTasks.activeTaskItems;
      expect(items).toHaveLength(1);
      // rule.after(completedOn=2025-12-01, false) -> 2025-12-05 Friday.
      expect(items[0].dueDate.toISOString()).toBe("2025-12-05T00:00:00.000Z");
    });

    test("sorts the returned items ascending by resolved dueDate", () => {
      const late = makeRecord({
        id: "sort-late",
        title: "Late",
        dueDate: new Date("2026-08-01"),
      });
      const early = makeRecord({
        id: "sort-early",
        title: "Early",
        dueDate: new Date("2026-06-01"),
      });
      const recurring = makeRecord({
        id: "sort-recurring",
        title: "Recurring",
        // anchor far in past → resolved dueDate is 2026-05-08 (a Friday),
        // earlier than the other two.
        dueDate: new Date("2025-11-14"),
        recurrence: "FREQ=WEEKLY;BYDAY=FR",
      });

      subscriptionInstance.data = [late, early, recurring];

      expect(customTasks.activeTaskItems.map((i) => i.key)).toEqual([
        "sort-recurring",
        "sort-early",
        "sort-late",
      ]);
    });
  });
});
