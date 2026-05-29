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
import { UsAzDateHash } from "../utils/utils";
import { ImportantDatesFAQPresenter } from "./ImportantDatesFAQPresenter";

const allDateHashes = [
  "tprDate",
  "dtpDate",
  "csbdDate-trToAddDate",
  "ercdDate-addDate",
  "sedDate",
  "csedDate",
];
const mockSomeDates: UsAzDisplayedDates = [
  { dateKey: "tprDate", date: new Date("2024-03-15") },
  { dateKey: "csbdDate", date: new Date("2024-01-10") },
  { dateKey: "ercdDate", date: new Date("2024-06-01") },
  { dateKey: "sedDate", date: new Date("2024-12-01") },
];
const someDateHashes = [
  "tprDate",
  "csbdDate-trToAddDate",
  "ercdDate-addDate",
  "sedDate",
];
const mockToggledPanels = {
  testSection: { foo: true, bar: false, baz: undefined },
  anotherSection: {},
};

let presenter: ImportantDatesFAQPresenter;
const t = vi.fn() as unknown as UsAzTFunction;

beforeEach(() => {
  sessionStorage.clear();
});

function getPresenter(dates: UsAzDisplayedDates, hash: UsAzDateHash | "") {
  return new ImportantDatesFAQPresenter(dates, t, hash as UsAzDateHash);
}

describe("personalDates", () => {
  it("sorts displayed dates", () => {
    presenter = getPresenter(mockSomeDates, "tprDate");
    expect(presenter.personalDates).toEqual(someDateHashes);
  });
});

describe("initializing isViewingAllDates", () => {
  it("defaults to personal dates when person has some dates", () => {
    presenter = getPresenter(mockSomeDates, "");
    expect(presenter.isViewingAllDates).toEqual(false);
  });

  it("saves preference for all dates when hash isn't in person's dates", () => {
    presenter = getPresenter(mockSomeDates, "dtpDate");
    expect(presenter.isViewingAllDates).toEqual(true);

    const newPresenter = getPresenter([], "");
    expect(newPresenter.isViewingAllDates).toEqual(true);
  });

  it("saves preference for all dates when person has no dates", () => {
    presenter = getPresenter([], "");
    expect(presenter.isViewingAllDates).toEqual(true);

    const newPresenter = getPresenter([], "");
    expect(newPresenter.isViewingAllDates).toEqual(true);
  });
});

describe("updating isViewingAllDates and toggledPanelsBySection", () => {
  beforeEach(() => {
    presenter = getPresenter(mockSomeDates, "tprDate");
  });

  it("can change to viewing all dates", () => {
    presenter.isViewingAllDates = true;
    expect(presenter.dateHashes).toEqual(allDateHashes);
  });

  it("can change to viewing personal dates", () => {
    presenter.isViewingAllDates = true;
    presenter.isViewingAllDates = false;
    expect(presenter.dateHashes).toEqual(someDateHashes);
  });

  test("toggledPanelsBySection getter/setter", () => {
    presenter.toggledPanelsBySection = mockToggledPanels;
    expect(presenter.toggledPanelsBySection).toEqual(mockToggledPanels);
  });

  it("persists changes across sessions", () => {
    presenter.toggledPanelsBySection = mockToggledPanels;
    presenter.isViewingAllDates = true;

    const newPresenter = getPresenter(mockSomeDates, "tprDate");
    expect(newPresenter.toggledPanelsBySection).toEqual(mockToggledPanels);
    expect(newPresenter.isViewingAllDates).toEqual(true);
  });
});
