// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { render, screen } from "@testing-library/react";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import selectEvent from "react-select-event";
import { useQueryParams } from "use-query-params";

import { useRootStore } from "../../../components/StoreProvider";
import CoreStore from "../../CoreStore";
import FiltersStore from "../../CoreStore/FiltersStore";
import { useCoreStore } from "../../CoreStoreProvider";
import filterOptions from "../../utils/filterOptions";
import PathwaysFilterBar from "..";

const mockSetQuery = jest.fn();

jest.mock("../../CoreStoreProvider");
jest.mock("../../../components/StoreProvider");
jest.mock("use-query-params");
const mockCoreStore = { currentTenantId: "US_ID" } as CoreStore;
const filtersStore = new FiltersStore({ rootStore: mockCoreStore });

beforeEach(() => {
  (useCoreStore as jest.Mock).mockReturnValue({
    filtersStore,
  });
  (useRootStore as jest.Mock).mockReturnValue({
    userStore: { userAllowedNavigation: {} },
  });
  (useQueryParams as jest.Mock).mockReturnValue(["query", mockSetQuery]);
});

afterEach(() => {
  jest.resetAllMocks();
});

test("selecting from menu sets the query params", async () => {
  render(
    <Router>
      <PathwaysFilterBar
        filterOptions={filterOptions.US_ID}
        handleDownload={jest.fn()}
        enabledFilters={["timePeriod", "gender"]}
      />
    </Router>
  );

  await selectEvent.select(screen.getByText("6 months"), ["1 year"]);
  await selectEvent.select(screen.getByText("All"), ["Female"]);

  expect(mockSetQuery).toHaveBeenCalledTimes(3);
  // the first call is on initial load, setting the query param to default value
  expect(mockSetQuery.mock.calls[0]).toEqual([
    { gender: "All", timePeriod: "6 months" },
    "replace",
  ]);
  // second call is the time period select event
  expect(mockSetQuery.mock.calls[1]).toEqual([{ timePeriod: "1 year" }]);
  // third call is the gender select event
  expect(mockSetQuery.mock.calls[2]).toEqual([{ gender: "Female" }]);
});
