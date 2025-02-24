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

import { observable } from "mobx";

import { AnyWorkflowsSystemConfig } from "../../core/models/types";
import { SearchStore } from "../SearchStore";
import { WorkflowsStore } from "../WorkflowsStore";

let searchStore: SearchStore;
let workflowsStore: WorkflowsStore;

beforeEach(() => {
  workflowsStore = observable({
    rootStore: {
      currentTenantId: "US_ND",
    },
    systemConfigFor: vi.fn(() => ({
      search: [{ searchType: "OFFICER", searchTitle: "officer" }],
    })),
  }) as unknown as WorkflowsStore;
  searchStore = new SearchStore(workflowsStore);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("searchTitleOverride", () => {
  test("when system == ALL returns the default title", () => {
    expect(searchStore.searchTitleOverride("ALL", "default")).toEqual(
      "default",
    );
  });

  test("when there is a searchTypeOverride it returns corresponding searchTitle", () => {
    workflowsStore.systemConfigFor = vi.fn(
      (system) =>
        ({
          search: [
            {
              searchType: "OFFICER",
              searchTitle: "officer title",
              searchField: "any",
            },
            {
              searchType: "LOCATION",
              searchTitle: "location title",
              searchField: "any",
            },
          ],
        }) as unknown as AnyWorkflowsSystemConfig,
    );
    searchStore.setSearchTypeOverride("LOCATION");
    expect(searchStore.searchTitleOverride("SUPERVISION", "default")).toEqual(
      "location title",
    );
  });

  test("when there is only one corresponding searchConfigs and no searchTypeOverride, it returns the search title", () => {
    expect(searchStore.searchTitleOverride("SUPERVISION", "default")).toEqual(
      "officer",
    );
  });

  test("when there are more than one corresponding searchConfigs and no searchTypeOverride, it returns the default", () => {
    workflowsStore.systemConfigFor = vi.fn(
      (system) =>
        ({
          search: [
            {
              searchType: "OFFICER",
              searchTitle: "officer title",
              searchField: "any",
            },
            {
              searchType: "LOCATION",
              searchTitle: "location title",
              searchField: "any",
            },
          ],
        }) as unknown as AnyWorkflowsSystemConfig,
    );
    expect(searchStore.searchTitleOverride("SUPERVISION", "default")).toEqual(
      "default",
    );
  });

  test("it applies the callbackFn", () => {
    const callback = (value: string) => {
      return [
        "case manager",
        "officer",
        "agent",
        "supervision officer",
      ].includes(value)
        ? "replacement value"
        : value;
    };
    expect(
      searchStore.searchTitleOverride("SUPERVISION", "default", callback),
    ).toEqual("replacement value");
  });
});
