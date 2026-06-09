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

import tk from "timekeeper";

import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { Client } from "../../WorkflowsStore/Client";
import {
  CustomTaskItem,
  SupervisionTask,
} from "../../WorkflowsStore/Task/types";
import TasksFilterStore from "../TasksFilterStore";

const mockAnalyticsStore = {
  trackTaskFilterSelected: vi.fn(),
  trackTaskFilterChanged: vi.fn(),
  trackTaskTableCategorySelected: vi.fn(),
  trackTaskFiltersReset: vi.fn(),
  trackTaskFiltersCleared: vi.fn(),
  trackTaskViewChanged: vi.fn(),
} as any as AnalyticsStore;

const mockTenantStore = {
  taskCategories: ["ALL_TASKS", "OVERDUE", "DUE_THIS_WEEK", "DUE_THIS_MONTH"],
  tasksConfiguration: {
    tasks: {
      assessment: {
        constructor: vi.fn(),
      },
      employment: {
        constructor: vi.fn(),
      },
    },
    filters: [
      {
        field: "supervisionLevel",
        type: "person",
        options: [
          { value: "Low" },
          { value: "Medium" },
          { value: "High" },
          { value: "Limited" },
        ],
      },
      {
        field: "district",
        type: "person",
        options: [
          { value: "D1" },
          { value: "D31" },
          { value: "D10" },
          { value: "D7" },
        ],
      },
      {
        field: "type",
        type: "task",
        options: [
          { value: "employment" },
          { value: "assessment" },
          { value: "homeVisit" },
          { value: "contact" },
        ],
      },
    ],
  },
} as any as TenantStore;

const mockWorkflowsStore = {
  caseloadPersons: [],
  searchStore: { selectedSearchIds: ["1", "2"] },
} as any as WorkflowsStore;

let filterStore: TasksFilterStore;

beforeEach(() => {
  filterStore = new TasksFilterStore(
    mockAnalyticsStore,
    mockTenantStore,
    mockWorkflowsStore,
  );
});

it("logs filter changes", () => {
  filterStore.unsetFilter("supervisionLevel", { value: "Low" });

  expect(mockAnalyticsStore.trackTaskFilterChanged).toHaveBeenLastCalledWith({
    changedFilterValue: "Low",
    changedFilterCategory: "supervisionLevel",
    changedFilterSelected: false,
    selectedFilters: {},
    onlyClicked: false,
  });

  filterStore.unsetFilter("supervisionLevel", { value: "High" });

  expect(mockAnalyticsStore.trackTaskFilterChanged).toHaveBeenLastCalledWith({
    changedFilterValue: "High",
    changedFilterCategory: "supervisionLevel",
    changedFilterSelected: false,
    onlyClicked: false,
    selectedFilters: {},
  });

  filterStore.setOnlyFilterForField("district", { value: "D31" });

  expect(mockAnalyticsStore.trackTaskFilterChanged).toHaveBeenLastCalledWith({
    changedFilterValue: "D31",
    changedFilterCategory: "district",
    changedFilterSelected: true,
    onlyClicked: true,
    selectedFilters: {
      district: ["D31"],
    },
  });
});

describe("storing filter state", () => {
  it("starts with no filters selected", () => {
    expect(filterStore.selectedFilters).toEqual({});
  });

  it("stores multiple selected filters", () => {
    filterStore.setOnlyFilterForField("supervisionLevel", {
      value: "Low",
    });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();

    filterStore.setFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeTrue();
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();
  });

  it("setFilter() does not deselect selected filters", () => {
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();

    filterStore.setFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeTrue();

    filterStore.unsetFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();
  });

  it("resetting sets all filters", () => {
    filterStore.setOnlyFilterForField("supervisionLevel", {
      value: "Low",
    });
    filterStore.setFilter("supervisionLevel", { value: "High" });
    filterStore.setOnlyFilterForField("caseType", {
      value: "general",
    });
    filterStore.setOnlyFilterForField("displayName", {
      value: "Bob",
    });
    filterStore.selectAllFilters();
    expect(filterStore.selectedFilters).toEqual({
      district: ["D1", "D31", "D10", "D7"],
      supervisionLevel: ["Low", "Medium", "High", "Limited"],
      type: ["employment", "assessment", "homeVisit", "contact"],
    });

    expect(mockAnalyticsStore.trackTaskFiltersReset).toHaveBeenLastCalledWith({
      selectedFiltersBeforeReset: {
        caseType: ["general"],
        displayName: ["Bob"],
        supervisionLevel: ["Low", "High"],
      },
    });
  });

  it("clearing sets a cleared entry for all filter fields", () => {
    filterStore.clearFilters();
    expect(filterStore.selectedFilters).toEqual({
      district: undefined,
      supervisionLevel: undefined,
      type: undefined,
    });

    expect(
      mockAnalyticsStore.trackTaskFiltersCleared,
    ).toHaveBeenLastCalledWith();
  });

  it("toggles filters", () => {
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();

    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeTrue();
  });

  it("can toggle multiple filters", () => {
    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    filterStore.toggleFilter("supervisionLevel", { value: "Low" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeTrue();
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();

    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();

    filterStore.toggleFilter("district", { value: "District 10" });
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "High",
      }),
    ).toBeFalse();
    expect(
      filterStore.filterIsSelected("supervisionLevel", {
        value: "Low",
      }),
    ).toBeTrue();
    expect(
      filterStore.filterIsSelected("district", {
        value: "District 10",
      }),
    ).toBeTrue();
  });

  it("can track when all filters are selected", () => {
    // By default, no filters are selected
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Select high
    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Select low
    filterStore.toggleFilter("supervisionLevel", { value: "Low" });
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Deselect high
    filterStore.toggleFilter("supervisionLevel", { value: "High" });
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Deselect low
    filterStore.toggleFilter("supervisionLevel", { value: "Low" });
    expect(filterStore.allFiltersSelected).toBeFalse();
    // Reselect all
    filterStore.selectAllFilters();
    expect(filterStore.allFiltersSelected).toBeTrue();
    // Deselect all
    filterStore.clearFilters();
    expect(filterStore.allFiltersSelected).toBeFalse();
  });
});

describe("allTasksForCategory with custom tasks", () => {
  // Frozen 2026-05-14 is a Thursday in mid-May.
  const FROZEN_NOW = new Date("2026-05-14T12:00:00.000Z");

  type FakeClient = Partial<Client> & {
    supervisionTasks?: any;
    customTasks?: any;
  };

  function makeSupervisionTask(
    overrides: Partial<SupervisionTask> = {},
  ): SupervisionTask {
    return {
      type: "assessment",
      key: "sup-1",
      dueDate: new Date("2026-05-20"),
      isOverdue: false,
      isSnoozed: false,
      displayName: "Risk Assessment",
      ...overrides,
    } as unknown as SupervisionTask;
  }

  function makeCustomTaskItem(
    overrides: Partial<CustomTaskItem> = {},
  ): CustomTaskItem {
    return {
      type: "customTask",
      key: "cust-1",
      dueDate: new Date("2026-05-20"),
      isOverdue: false,
      isSnoozed: false,
      displayName: "Pickup paperwork",
      frequency: "One-time",
      ...overrides,
    } as unknown as CustomTaskItem;
  }

  function makeClient({
    supervisionTasks,
    customTasks,
  }: {
    supervisionTasks?: {
      orderedTasks: SupervisionTask[];
      readyOrderedTasks: SupervisionTask[];
    };
    customTasks?: { activeTaskItems: CustomTaskItem[] };
  } = {}): Client {
    const client = Object.create(Client.prototype) as FakeClient;
    client.supervisionTasks = supervisionTasks;
    client.customTasks = customTasks;
    return client as Client;
  }

  function buildStore({
    persons,
    flagOn,
  }: {
    persons: Client[];
    flagOn: boolean;
  }) {
    const ws = {
      caseloadPersons: persons,
      searchStore: { selectedSearchIds: ["1"] },
      rootStore: {
        userStore: {
          activeFeatureVariants: flagOn ? { customTasks: {} } : {},
        },
      },
    } as any as WorkflowsStore;
    return new TasksFilterStore(mockAnalyticsStore, mockTenantStore, ws);
  }

  beforeEach(() => {
    tk.freeze(FROZEN_NOW);
  });

  afterEach(() => {
    tk.reset();
  });

  it("ignores custom tasks when the customTasks flag is off", () => {
    const supervisionTask = makeSupervisionTask({
      key: "sup-only",
      dueDate: new Date("2026-05-20"),
    });
    const customItem = makeCustomTaskItem({
      key: "ignored-custom",
      dueDate: new Date("2026-05-22"),
    });
    const client = makeClient({
      supervisionTasks: {
        orderedTasks: [supervisionTask],
        readyOrderedTasks: [supervisionTask],
      },
      customTasks: { activeTaskItems: [customItem] },
    });

    const store = buildStore({ persons: [client], flagOn: false });
    const items = store.allTasksForCategory("DUE_THIS_MONTH", false);
    expect(items).toEqual([supervisionTask]);
  });

  it("returns the only custom task for a client when flag is on and no supervision tasks exist", () => {
    const customItem = makeCustomTaskItem({
      key: "custom-only",
      dueDate: new Date("2026-05-20"),
    });
    const client = makeClient({
      supervisionTasks: {
        orderedTasks: [],
        readyOrderedTasks: [],
      },
      customTasks: { activeTaskItems: [customItem] },
    });

    const store = buildStore({ persons: [client], flagOn: true });
    expect(store.allTasksForCategory("DUE_THIS_MONTH", false)).toEqual([
      customItem,
    ]);
  });

  it("returns an overdue custom task in OVERDUE for an otherwise-empty client", () => {
    const customItem = makeCustomTaskItem({
      key: "custom-overdue",
      dueDate: new Date("2026-01-01"),
      isOverdue: true,
    });
    const client = makeClient({
      supervisionTasks: { orderedTasks: [], readyOrderedTasks: [] },
      customTasks: { activeTaskItems: [customItem] },
    });

    const store = buildStore({ persons: [client], flagOn: true });
    expect(store.allTasksForCategory("OVERDUE", false)).toEqual([customItem]);
  });

  it("buckets supervision and custom tasks into separate categories", () => {
    const supervisionOverdue = makeSupervisionTask({
      key: "sup-overdue",
      dueDate: new Date("2026-01-01"),
      isOverdue: true,
    });
    const customDueMonth = makeCustomTaskItem({
      key: "custom-month",
      dueDate: new Date("2026-05-20"),
    });
    const client = makeClient({
      supervisionTasks: {
        orderedTasks: [supervisionOverdue],
        readyOrderedTasks: [supervisionOverdue],
      },
      customTasks: { activeTaskItems: [customDueMonth] },
    });

    const store = buildStore({ persons: [client], flagOn: true });
    expect(store.allTasksForCategory("OVERDUE", false)).toEqual([
      supervisionOverdue,
    ]);
    expect(store.allTasksForCategory("DUE_THIS_MONTH", false)).toEqual([
      customDueMonth,
    ]);
  });

  it("keeps a client visible when their supervision task is snoozed but they have an active custom task", () => {
    // Snoozed supervision task is in orderedTasks but NOT readyOrderedTasks
    // (the bug repro: previously this client would drop out of the table).
    const snoozedSupervision = makeSupervisionTask({
      key: "sup-snoozed",
      dueDate: new Date("2026-05-22"),
      isSnoozed: true,
    });
    const customDueMonth = makeCustomTaskItem({
      key: "custom-survives",
      dueDate: new Date("2026-05-20"),
    });
    const client = makeClient({
      supervisionTasks: {
        orderedTasks: [snoozedSupervision],
        readyOrderedTasks: [],
      },
      customTasks: { activeTaskItems: [customDueMonth] },
    });

    const store = buildStore({ persons: [client], flagOn: true });
    expect(store.allTasksForCategory("DUE_THIS_MONTH", false)).toEqual([
      customDueMonth,
    ]);
  });

  it("HIDDEN returns only snoozed supervision tasks, not custom tasks", () => {
    const snoozedSupervision = makeSupervisionTask({
      key: "sup-snoozed",
      dueDate: new Date("2026-05-22"),
      isSnoozed: true,
    });
    const customDueMonth = makeCustomTaskItem({
      key: "custom-active",
      dueDate: new Date("2026-05-20"),
    });
    const client = makeClient({
      supervisionTasks: {
        orderedTasks: [snoozedSupervision],
        readyOrderedTasks: [],
      },
      customTasks: { activeTaskItems: [customDueMonth] },
    });

    const store = buildStore({ persons: [client], flagOn: true });
    expect(store.allTasksForCategory("HIDDEN", false)).toEqual([
      snoozedSupervision,
    ]);
  });

  it("filtering by type='customTask' narrows results to custom tasks only", () => {
    const supervisionTask = makeSupervisionTask({
      type: "assessment",
      key: "sup-1",
      dueDate: new Date("2026-05-20"),
    });
    const customTask = makeCustomTaskItem({
      key: "cust-1",
      dueDate: new Date("2026-05-21"),
    });
    const client = makeClient({
      supervisionTasks: {
        orderedTasks: [supervisionTask],
        readyOrderedTasks: [supervisionTask],
      },
      customTasks: { activeTaskItems: [customTask] },
    });

    const store = buildStore({ persons: [client], flagOn: true });
    store.setFilter("type", { value: "customTask" });
    expect(store.allTasksForCategory("ALL_TASKS", true)).toEqual([customTask]);
    expect(store.allTasksForCategory("DUE_THIS_MONTH", true)).toEqual([
      customTask,
    ]);
  });

  it("personMatchesFilters passes for a custom-only client when flag is on", () => {
    const customTask = makeCustomTaskItem({
      type: "customTask",
      key: "cust-only",
      dueDate: new Date("2026-05-20"),
    });
    const client = makeClient({
      supervisionTasks: { orderedTasks: [], readyOrderedTasks: [] },
      customTasks: { activeTaskItems: [customTask] },
    });

    const store = buildStore({ persons: [client], flagOn: true });
    store.setFilter("type", { value: "customTask" });
    expect(store.personMatchesFilters(client)).toBe(true);
  });

  it("personMatchesFilters fails for a custom-only client when flag is off even when filter would match", () => {
    const customTask = makeCustomTaskItem({
      type: "customTask",
      key: "cust-only",
      dueDate: new Date("2026-05-20"),
    });
    const client = makeClient({
      supervisionTasks: { orderedTasks: [], readyOrderedTasks: [] },
      customTasks: { activeTaskItems: [customTask] },
    });

    const store = buildStore({ persons: [client], flagOn: false });
    // Any supervision-task-typed filter — the client has no supervision tasks
    // and (with the flag off) no custom tasks are pulled in, so the person
    // can't match any task-typed filter.
    store.setFilter("type", { value: "assessment" });
    expect(store.personMatchesFilters(client)).toBe(false);
  });
});
