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

import * as Sentry from "@sentry/react";
import tk from "timekeeper";
import { Mock } from "vitest";

import { TENANT_CONFIGS } from "../../../tenants";
import { Client } from "../../Client";
import { CollectionDocumentSubscription } from "../../subscriptions/CollectionDocumentSubscription";
import { SupervisionTaskUpdateSubscription } from "../../subscriptions/SupervisionTaskUpdateSubscription";
import { homeVisitTaskRecord } from "../fixtures";
import { SupervisionTasks } from "../SupervisionTasks";
import { taskDueDateComparator } from "../TasksBase";
import { SupervisionTask, SupervisionTaskType } from "../types";

vi.mock("@sentry/react");
vi.mock("../../subscriptions/CollectionDocumentSubscription");
// `SupervisionTaskUpdateSubscription` extends `CollectionDocumentSubscription`
// (mocked above); an explicit factory (rather than the default automock)
// avoids constructing through that mocked-extends-mocked chain, so
// `mockImplementation` below reliably controls the returned instance.
vi.mock("../../subscriptions/SupervisionTaskUpdateSubscription", () => ({
  SupervisionTaskUpdateSubscription: vi.fn(),
}));
vi.mock("../../../tenants", () => ({ TENANT_CONFIGS: {} }));

class FakeSupervisionTask {
  rootStore: unknown;

  taskRecord: unknown;

  person: unknown;

  updates: unknown;

  constructor(
    rootStore: unknown,
    taskRecord: unknown,
    person: unknown,
    updates: unknown,
  ) {
    this.rootStore = rootStore;
    this.taskRecord = taskRecord;
    this.person = person;
    this.updates = updates;
  }
}

describe("taskDueDateComparator", () => {
  beforeEach(() => {
    tk.freeze(new Date(2023, 2, 7));
  });

  it("sorts by overdue dates when all tasks are overdue", () => {
    const tasks = [
      { dueDate: new Date(2020, 1, 1), type: "assessment" },
      { dueDate: new Date(2018, 1, 1), type: "contact" },
      { dueDate: new Date(2019, 1, 1), type: "homeVisit" },
    ] as SupervisionTask<SupervisionTaskType>[];

    expect(tasks.sort(taskDueDateComparator).map((t) => t.type)).toEqual([
      "contact",
      "homeVisit",
      "assessment",
    ]);
  });

  it("sorts by upcoming by dates", () => {
    const tasks = [
      { dueDate: new Date(2025, 1, 4), type: "homeVisit" },
      { dueDate: new Date(2025, 1, 2), type: "assessment" },
      { dueDate: new Date(2025, 1, 3), type: "contact" },
    ] as SupervisionTask<SupervisionTaskType>[];

    expect(tasks.sort(taskDueDateComparator).map((t) => t.type)).toEqual([
      "assessment",
      "contact",
      "homeVisit",
    ]);
  });
});

describe("TasksBase.tasks getter", () => {
  const RECORD_ID = "us_mo_123";

  const CollectionDocumentSubscriptionMock = vi.mocked(
    CollectionDocumentSubscription,
  );
  const SupervisionTaskUpdateSubscriptionMock = vi.mocked(
    SupervisionTaskUpdateSubscription,
  );

  let taskSubscriptionInstance: {
    data: unknown;
    hydrate: Mock;
    unsubscribe: Mock;
    hydrationState: { status: string };
  };
  let updatesSubscriptionInstance: {
    data: unknown;
    hydrate: Mock;
    unsubscribe: Mock;
    hydrationState: { status: string };
  };
  let supervisionTasks: SupervisionTasks<"US_MO">;

  beforeEach(() => {
    taskSubscriptionInstance = {
      data: undefined,
      hydrate: vi.fn(),
      unsubscribe: vi.fn(),
      hydrationState: { status: "hydrated" },
    };
    updatesSubscriptionInstance = {
      data: {},
      hydrate: vi.fn(),
      unsubscribe: vi.fn(),
      hydrationState: { status: "hydrated" },
    };
    CollectionDocumentSubscriptionMock.mockImplementation(
      () => taskSubscriptionInstance as never,
    );
    SupervisionTaskUpdateSubscriptionMock.mockImplementation(
      () => updatesSubscriptionInstance as never,
    );

    (TENANT_CONFIGS as any).US_MO = {
      workflowsTasksConfig: {
        collection: "usMoSupervisionTasks",
        tasks: {
          homeVisit: { constructor: FakeSupervisionTask },
        },
      },
    };

    const clientMock = {
      recordId: RECORD_ID,
      stateCode: "US_MO",
      rootStore: {
        tenantStore: {
          currentTenantId: "US_MO",
          tasksConfiguration: { collection: "usMoSupervisionTasks" },
        },
        userStore: { activeFeatureVariants: { usIdTasksV2: false } },
        firestoreStore: {},
      },
    } as any as Client;

    supervisionTasks = new SupervisionTasks("US_MO", clientMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("drops a task that fails schema validation, keeps a valid sibling, and reports to Sentry", () => {
    const malformedTask = {
      ...homeVisitTaskRecord,
      // dueDate should be a string; this violates the schema.
      dueDate: 12345,
    };
    taskSubscriptionInstance.data = {
      externalId: "102",
      officerId: "OFFICER1",
      stateCode: "US_MO",
      tasks: [homeVisitTaskRecord, malformedTask],
    };

    const tasks = supervisionTasks.tasks;

    expect(tasks).toHaveLength(1);
    expect((tasks[0] as unknown as FakeSupervisionTask).taskRecord).toEqual(
      homeVisitTaskRecord,
    );

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [error] = (Sentry.captureException as Mock).mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(
      /Task record of type \[homeVisit\] failed schema validation/,
    );
  });

  it("drops a task with an unrecognized type and reports to Sentry", () => {
    const unknownTypeTask = {
      ...homeVisitTaskRecord,
      type: "notARealTaskType",
    };
    taskSubscriptionInstance.data = {
      externalId: "102",
      officerId: "OFFICER1",
      stateCode: "US_MO",
      tasks: [unknownTypeTask],
    };

    const tasks = supervisionTasks.tasks;

    expect(tasks).toHaveLength(0);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [error] = (Sentry.captureException as Mock).mock.calls[0];
    expect((error as Error).message).toMatch(
      /Missing a class constructor for task with type: notARealTaskType/,
    );
  });

  it("includes a task that passes schema validation without reporting to Sentry", () => {
    taskSubscriptionInstance.data = {
      externalId: "102",
      officerId: "OFFICER1",
      stateCode: "US_MO",
      tasks: [homeVisitTaskRecord],
    };

    const tasks = supervisionTasks.tasks;

    expect(tasks).toHaveLength(1);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
