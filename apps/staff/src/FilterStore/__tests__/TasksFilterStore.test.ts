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

import { FilterSection } from "../../core/models/types";
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

describe("dynamicFilters feature variant", () => {
  const dynamicTenantStore = {
    taskCategories: ["ALL_TASKS", "OVERDUE", "DUE_THIS_MONTH"],
    tasksConfiguration: {
      tasks: {},
      filters: [
        {
          title: "Task Type",
          field: "type",
          type: "task",
          options: [{ value: "employment" }],
        },
        {
          title: "Supervision Level",
          field: "supervisionLevel",
          type: "person",
          dynamic: true,
          options: [{ value: "Low" }, { value: "Medium" }, { value: "High" }],
        },
        {
          title: "Case Type",
          field: "caseType",
          type: "person",
          dynamic: true,
          options: [
            { value: "General" },
            {
              value: "Parole Or Condition Release Less Than 12 Months",
              shortLabel: "Parole/Release <12 Months",
            },
          ],
        },
        {
          // Not opted into dynamic derivation (no `dynamic: true`).
          title: "District",
          field: "district",
          type: "person",
          options: [{ value: "D1" }, { value: "D2" }],
        },
      ],
    },
  } as any as TenantStore;

  function buildDynamicStore({
    persons,
    flagOn,
    isUsIdLegacyTasksEnabled = false,
  }: {
    persons: Partial<Client>[];
    flagOn: boolean;
    isUsIdLegacyTasksEnabled?: boolean;
  }) {
    const ws = {
      caseloadPersons: persons,
      isDynamicFiltersEnabled: flagOn,
      isUsIdLegacyTasksEnabled,
      searchStore: { selectedSearchIds: ["1"] },
    } as any as WorkflowsStore;
    return new TasksFilterStore(mockAnalyticsStore, dynamicTenantStore, ws);
  }

  const optionsFor = (store: TasksFilterStore, field: string) =>
    store.filters.find((f) => f.field === field)?.options;

  it("leaves options as the static config when the flag is off", () => {
    const store = buildDynamicStore({
      persons: [{ supervisionLevel: "Maximum", caseType: "Sex Offense" }],
      flagOn: false,
    });
    expect(optionsFor(store, "supervisionLevel")).toEqual([
      { value: "Low" },
      { value: "Medium" },
      { value: "High" },
    ]);
    expect(optionsFor(store, "caseType")).toEqual([
      { value: "General" },
      {
        value: "Parole Or Condition Release Less Than 12 Months",
        shortLabel: "Parole/Release <12 Months",
      },
    ]);
  });

  it("retains all static options and appends values found only in the data", () => {
    const store = buildDynamicStore({
      persons: [
        // "Maximum" / "Sex Offense" are not in the static config.
        { supervisionLevel: "High", caseType: "Sex Offense" },
        { supervisionLevel: "Maximum", caseType: "General" },
      ],
      flagOn: true,
    });
    // Full static list (Low, Medium, High) retained even though Low/Medium are
    // absent from the data; "Maximum" appended.
    expect(optionsFor(store, "supervisionLevel")).toEqual([
      { value: "Low" },
      { value: "Medium" },
      { value: "High" },
      { value: "Maximum" },
    ]);
    // Full static list retained (including Parole..., absent from data);
    // "Sex Offense" appended.
    expect(optionsFor(store, "caseType")).toEqual([
      { value: "General" },
      {
        value: "Parole Or Condition Release Less Than 12 Months",
        shortLabel: "Parole/Release <12 Months",
      },
      { value: "Sex Offense" },
    ]);
  });

  it("keeps the static option (with its shortLabel) when the data value matches it", () => {
    const store = buildDynamicStore({
      persons: [
        { caseType: "Parole Or Condition Release Less Than 12 Months" },
        { caseType: "Domestic Violence" },
      ],
      flagOn: true,
    });
    // Parole... matches a config option, so it is not duplicated and keeps its
    // shortLabel; Domestic Violence is a data-only value appended after.
    expect(optionsFor(store, "caseType")).toEqual([
      { value: "General" },
      {
        value: "Parole Or Condition Release Less Than 12 Months",
        shortLabel: "Parole/Release <12 Months",
      },
      { value: "Domestic Violence" },
    ]);
  });

  it("keeps config options in config order, then appends data-only values alphabetically", () => {
    const store = buildDynamicStore({
      persons: [
        { supervisionLevel: "High", caseType: "Sex Offense" },
        { supervisionLevel: "Low", caseType: "General" },
        { supervisionLevel: "Maximum", caseType: "Domestic Violence" },
        {
          supervisionLevel: "High",
          caseType: "Parole Or Condition Release Less Than 12 Months",
        },
      ],
      flagOn: true,
    });
    // Config order (Low, Medium, High) preserved in full, then "Maximum".
    expect(optionsFor(store, "supervisionLevel")).toEqual([
      { value: "Low" },
      { value: "Medium" },
      { value: "High" },
      { value: "Maximum" },
    ]);
    // Config order (General, Parole...) preserved, then data-only values
    // (Domestic Violence, Sex Offense) appended alphabetically.
    expect(optionsFor(store, "caseType")).toEqual([
      { value: "General" },
      {
        value: "Parole Or Condition Release Less Than 12 Months",
        shortLabel: "Parole/Release <12 Months",
      },
      { value: "Domestic Violence" },
      { value: "Sex Offense" },
    ]);
  });

  it("does not append empty/missing field values or persons lacking the getter", () => {
    const store = buildDynamicStore({
      persons: [
        { supervisionLevel: "High", caseType: "General" },
        { supervisionLevel: "", caseType: "" },
        {} as Partial<Client>,
      ],
      flagOn: true,
    });
    // Only the static config remains — no empty-string or undefined options.
    expect(optionsFor(store, "supervisionLevel")).toEqual([
      { value: "Low" },
      { value: "Medium" },
      { value: "High" },
    ]);
    expect(optionsFor(store, "caseType")).toEqual([
      { value: "General" },
      {
        value: "Parole Or Condition Release Less Than 12 Months",
        shortLabel: "Parole/Release <12 Months",
      },
    ]);
  });

  it("leaves person filters that don't opt into `dynamic` on the static config", () => {
    const store = buildDynamicStore({
      persons: [
        { supervisionLevel: "High", caseType: "General", district: "D9" },
      ],
      flagOn: true,
    });
    expect(optionsFor(store, "district")).toEqual([
      { value: "D1" },
      { value: "D2" },
    ]);
  });

  it("still drops the Task Type filter for US_ID legacy while applying dynamic options", () => {
    const store = buildDynamicStore({
      persons: [{ supervisionLevel: "High", caseType: "General" }],
      flagOn: true,
      isUsIdLegacyTasksEnabled: true,
    });
    expect(store.filters.find((f) => f.title === "Task Type")).toBeUndefined();
    expect(optionsFor(store, "supervisionLevel")).toEqual([
      { value: "Low" },
      { value: "Medium" },
      { value: "High" },
    ]);
  });

  describe("reconcileSelectedFilters", () => {
    // Unit-test the reconcile action directly with explicit option lists (the
    // constructor reaction feeds it `this.filters` in production). A
    // person-typed section carrying the given option values.
    const supervisionSection = (values: string[]): FilterSection => ({
      title: "Supervision Level",
      field: "supervisionLevel",
      type: "person",
      dynamic: true,
      options: values.map((value) => ({ value })),
    });

    it("extends a fully-selected field with a value that appears later", () => {
      const store = buildDynamicStore({ persons: [], flagOn: true });
      // Seed the last-known snapshot, then select everything offered.
      store.reconcileSelectedFilters([
        supervisionSection(["Low", "Medium", "High"]),
      ]);
      ["Low", "Medium", "High"].forEach((value) =>
        store.setFilter("supervisionLevel", { value }),
      );

      // A new distinct value appears in the option list.
      store.reconcileSelectedFilters([
        supervisionSection(["Low", "Medium", "High", "Maximum"]),
      ]);

      // "Select all" stays complete: the new value is included.
      expect(store.selectedFilters.supervisionLevel).toContain("Maximum");
    });

    it("seeds the baseline on construction so the first option change reconciles", () => {
      // No manual seeding reconcile — rely on the constructor's `fireImmediately`
      // reaction to have recorded the baseline from the initial `filters`
      // (static config: Low/Medium/High). Without it, this first change would be
      // treated as "no prior snapshot" and skipped.
      const store = buildDynamicStore({ persons: [], flagOn: true });
      ["Low", "Medium", "High"].forEach((value) =>
        store.setFilter("supervisionLevel", { value }),
      );

      store.reconcileSelectedFilters([
        supervisionSection(["Low", "Medium", "High", "Maximum"]),
      ]);

      expect(store.selectedFilters.supervisionLevel).toContain("Maximum");
    });

    it("does not extend a genuine subset selection", () => {
      const store = buildDynamicStore({ persons: [], flagOn: true });
      store.reconcileSelectedFilters([
        supervisionSection(["Low", "Medium", "High"]),
      ]);
      // User selects only "High" (a subset of the offered options).
      store.setFilter("supervisionLevel", { value: "High" });

      store.reconcileSelectedFilters([
        supervisionSection(["Low", "Medium", "High", "Maximum"]),
      ]);

      expect(store.selectedFilters.supervisionLevel).toEqual(["High"]);
    });

    it("prunes a selected value that is no longer offered, dropping empties", () => {
      const store = buildDynamicStore({ persons: [], flagOn: true });
      store.reconcileSelectedFilters([supervisionSection(["High", "Maximum"])]);
      store.setFilter("supervisionLevel", { value: "Maximum" });
      expect(store.selectedFilters.supervisionLevel).toEqual(["Maximum"]);

      // "Maximum" drops out of the options — it should be pruned from the
      // selection, emptying it, which removes the field key entirely.
      store.reconcileSelectedFilters([supervisionSection(["High"])]);

      expect(store.selectedFilters.supervisionLevel).toBeUndefined();
    });
  });

  it("constructs without throwing when the tenant config is not yet available", () => {
    // `tenantStore.tasksConfiguration` throws when a tenant id is set before its
    // config is registered (app startup, some tests). The constructor's
    // reconcile reaction reads `filters` eagerly, so this must not throw out of
    // the reaction — `filters` should fall back to an empty list instead.
    const throwingTenantStore = {
      taskCategories: [],
      get tasksConfiguration(): never {
        throw new TypeError(
          "Cannot read properties of undefined (reading 'workflowsTasksConfig')",
        );
      },
    } as any as TenantStore;
    const ws = {
      caseloadPersons: [],
      isDynamicFiltersEnabled: false,
      isUsIdLegacyTasksEnabled: false,
      searchStore: { selectedSearchIds: [] },
    } as any as WorkflowsStore;

    let store: TasksFilterStore | undefined;
    expect(() => {
      store = new TasksFilterStore(mockAnalyticsStore, throwingTenantStore, ws);
    }).not.toThrow();
    expect(store?.filters).toEqual([]);
  });
});
