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

import { BrowserRouter as Router } from "react-router-dom";
import { Mock } from "vitest";

import { useRootStore } from "../../../components/StoreProvider";
import { fireEvent, render, screen } from "../../../testUtils";
import CoreStore from "../../CoreStore";
import FiltersStore from "../../CoreStore/FiltersStore";
import { useCoreStore } from "../../CoreStoreProvider";
import filterOptions from "../../utils/filterOptions";
import PathwaysFilterBar from "..";

const mockSetFilters = vi.fn();

vi.mock("../../CoreStoreProvider");
vi.mock("../../../components/StoreProvider");

const mockCoreStore = { currentTenantId: "US_ID" } as CoreStore;
const filtersStore = new FiltersStore({ rootStore: mockCoreStore });

beforeEach(() => {
  (useCoreStore as Mock).mockReturnValue({
    filtersStore,
  });
  (useRootStore as Mock).mockReturnValue({
    userStore: { userAllowedNavigation: {} },
  });
  filtersStore.setFilters = mockSetFilters;
});

test("selecting from menu sets the filters", async () => {
  render(
    <Router>
      <PathwaysFilterBar
        filterOptions={filterOptions.US_ID}
        handleDownload={vi.fn()}
        enabledFilters={["timePeriod", "gender"]}
      />
    </Router>,
  );
  fireEvent.click(screen.getByLabelText("Select timePeriod"));
  fireEvent.click(await screen.findByText("1 year"));
  fireEvent.click(screen.getByLabelText("Select gender"));
  fireEvent.click(await screen.findByText("Female"));

  expect(mockSetFilters).toHaveBeenCalledTimes(2);
  // first call is the time period select event
  expect(mockSetFilters.mock.calls[0]).toEqual([{ timePeriod: ["12"] }]);
  // second call is the gender select event
  expect(mockSetFilters.mock.calls[1]).toEqual([{ gender: ["FEMALE"] }]);
});
