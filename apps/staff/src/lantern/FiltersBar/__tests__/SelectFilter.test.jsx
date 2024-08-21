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

import { act, render } from "@testing-library/react";
import { observable } from "mobx";
import React from "react";

import Select from "../../../controls/Select";
import filterOptions from "../../../RootStore/TenantStore/filterOptions";
import { US_MO } from "../../../RootStore/TenantStore/lanternTenants";
import { useLanternStore } from "../../LanternStoreProvider";
import {
  METRIC_PERIOD_MONTHS,
  SUPERVISION_LEVEL,
  SUPERVISION_TYPE,
} from "../../utils/constants";
import FilterField from "../FilterField";
import SelectFilter from "../SelectFilter";

vi.mock("../../../controls/Select", () => ({
  __esModule: true,
  default: vi.fn(),
}));
vi.mock("../FilterField", () => ({
  __esModule: true,
  default: vi.fn(),
}));
vi.mock("../../LanternStoreProvider");

const METADATA_NAMESPACE = import.meta.env.VITE_METADATA_NAMESPACE;

describe("SelectFilter tests", () => {
  const metadataField = `${METADATA_NAMESPACE}app_metadata`;
  const mockUser = { [metadataField]: { stateCode: US_MO } };
  const setFiltersMock = vi.fn();

  beforeEach(() => {
    useLanternStore.mockReturnValue({
      userStore: { user: mockUser, isAuthorized: true },
      currentTenantId: US_MO,
      filtersStore: {
        filters: observable.map({
          metricPeriodMonths:
            filterOptions[US_MO][METRIC_PERIOD_MONTHS].defaultValue,
          supervisionLevel:
            filterOptions[US_MO][SUPERVISION_LEVEL].defaultValue,
          supervisionType: filterOptions[US_MO][SUPERVISION_TYPE].defaultValue,
        }),
        filterOptions: filterOptions[US_MO],
        setFilters: setFiltersMock,
      },
    });

    FilterField.mockImplementation(({ children }) => children);
    Select.mockReturnValue(null);
  });

  it.each([
    { label: "Time Period", dimension: METRIC_PERIOD_MONTHS },
    { label: "Supervision Level", dimension: SUPERVISION_LEVEL },
    { label: "Supervision Type", dimension: SUPERVISION_TYPE },
  ])("should pass valid props to Select for $label", (props) => {
    render(<SelectFilter label={props.label} dimension={props.dimension} />);

    expect(Select).toHaveBeenCalledTimes(1);
    expect(Select.mock.calls[0][0]).toMatchObject({
      value: filterOptions[US_MO][props.dimension].defaultOption,
      options: filterOptions[US_MO][props.dimension].options,
      defaultValue: filterOptions[US_MO][props.dimension].defaultOption,
    });
  });

  it("onChange should change the filter value", () => {
    const updatedfilters = {
      [METRIC_PERIOD_MONTHS]: 99,
    };

    render(
      <SelectFilter label="Time Period" dimension={METRIC_PERIOD_MONTHS} />,
    );

    act(() => {
      Select.mock.calls[0][0].onChange({ value: 99 });
    });

    expect(setFiltersMock).toHaveBeenCalledTimes(1);
    expect(setFiltersMock.mock.calls[0][0]).toMatchObject(updatedfilters);
  });
});
