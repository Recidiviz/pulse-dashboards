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

import { ResidentRecord } from "~datatypes";

import { UsAzImportantDatesPresenter } from "./UsAzImportantDatesPresenter";

const mockAzResident = {
  stateCode: "US_AZ",
  metadata: {
    stateCode: "US_AZ",
    sedDate: "2023-12-01",
    ercdDate: "2024-01-15",
    csbdDate: undefined,
    csed: "2024-06-01",
  },
} as never as ResidentRecord;

const mockCaResident = {
  stateCode: "US_CA",
  metadata: {
    stateCode: "US_CA",
  },
} as never as ResidentRecord;

describe("UsAzImportantDatesPresenter", () => {
  it("returns the metadata blob when the state code is US_AZ", () => {
    const presenter = new UsAzImportantDatesPresenter(mockAzResident);
    expect(presenter.metadata).toEqual(mockAzResident.metadata);
  });

  it("throws an error when the state code is not US_AZ", () => {
    const presenter = new UsAzImportantDatesPresenter(mockCaResident);
    expect(() => presenter.metadata).toThrow(
      "Invalid state code for UsAzImportantDatesPresenter: US_CA",
    );
  });
});
