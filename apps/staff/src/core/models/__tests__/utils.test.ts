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

import { validateDynamicFilterOptions } from "../utils";

describe("validateDynamicFilterOption", () => {
  it("is true when the input is valid and length > 0", () => {
    const facilityOptions = [
      { label: "Option 1", value: "OPTION_1" },
      { label: "Option 2", value: "OPTION_2" },
    ];
    expect(validateDynamicFilterOptions(facilityOptions)).toBeTrue();
  });

  it("is false when the input is invalid", () => {
    const facilityOptions = [{ label: "Option 1" }, { value: "OPTION_2" }];
    expect(validateDynamicFilterOptions(facilityOptions)).toBeFalse();
  });

  it("is false when the input length is 0", () => {
    expect(validateDynamicFilterOptions([])).toBeFalse();
  });
});
