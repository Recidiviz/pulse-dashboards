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

import { UsAzTFunction } from "~@jii/translation";

import { UsAzDisplayedDates } from "../UsAzSingleResidentContext/SingleResidentContextPresenter";
import { ImportantDatesFAQPresenter } from "./ImportantDatesFAQPresenter";

const mockSomeDates: UsAzDisplayedDates = [
  { dateKey: "tprDate", date: new Date("2024-03-15") },
  { dateKey: "csbdDate", date: new Date("2024-01-10") },
  { dateKey: "ercdDate", date: new Date("2024-06-01") },
  { dateKey: "sedDate", date: new Date("2024-12-01") },
];

let presenter: ImportantDatesFAQPresenter;
const t = vi.fn() as unknown as UsAzTFunction;

beforeEach(() => {
  presenter = new ImportantDatesFAQPresenter(mockSomeDates, t);
});

describe("personalDates", () => {
  it("sorts displayed dates", () => {
    expect(presenter.personalDates).toEqual([
      "tprDate",
      "csbdDate-trToAddDate",
      "ercdDate-addDate",
      "sedDate",
    ]);
  });
});

describe("toggling isViewingAllDates", () => {
  it("showAllDates changes to viewing all dates", () => {
    presenter.showAllDates();
    expect(presenter.dateHashes).toEqual([
      "tprDate",
      "dtpDate",
      "csbdDate-trToAddDate",
      "ercdDate-addDate",
      "sedDate",
      "csedDate",
    ]);
  });

  it("showPersonalDates changes to viewing personal dates", () => {
    presenter.showAllDates();
    presenter.showPersonalDates();
    expect(presenter.dateHashes).toEqual([
      "tprDate",
      "csbdDate-trToAddDate",
      "ercdDate-addDate",
      "sedDate",
    ]);
  });
});
