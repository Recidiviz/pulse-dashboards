// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { hydrateUntypedCriteria } from "../criteriaUtils";

describe("hydrateUntypedCriteria", () => {
  it("preserves the order of criteriaCopy", () => {
    const criteriaCopy = {
      first: { text: "FIRST" },
      second: { text: "SECOND" },
      third: { text: "THIRD" },
      fourth: { text: "FOURTH" },
    };

    const recordCriteria = {
      first: {},
      fourth: {},
      third: {},
      second: {},
    };

    const hydrated = hydrateUntypedCriteria(recordCriteria, criteriaCopy);
    expect(hydrated).toEqual([
      { text: "FIRST" },
      { text: "SECOND" },
      { text: "THIRD" },
      { text: "FOURTH" },
    ]);
  });

  it("skips criteria that are not present in recordCriteria", () => {
    const criteriaCopy = {
      first: { text: "FIRST" },
      second: { text: "SECOND" },
      third: { text: "THIRD" },
      fourth: { text: "FOURTH" },
    };

    const recordCriteria = {
      first: {},
      fourth: {},
    };

    const hydrated = hydrateUntypedCriteria(recordCriteria, criteriaCopy);
    expect(hydrated).toEqual([{ text: "FIRST" }, { text: "FOURTH" }]);
  });

  it("skips criteria that are not present in criteriaCopy", () => {
    // Sometimes the record will contain reasons that we don't want to display to the user
    const criteriaCopy = {
      first: { text: "FIRST" },
      fourth: { text: "FOURTH" },
    };

    const recordCriteria = {
      first: {},
      fourth: {},
      third: {},
      second: {},
    };

    const hydrated = hydrateUntypedCriteria(recordCriteria, criteriaCopy);
    expect(hydrated).toEqual([{ text: "FIRST" }, { text: "FOURTH" }]);
  });

  it("includes criteria no matter what the reason value is", () => {
    const criteriaCopy = {
      first: { text: "FIRST" },
      second: { text: "SECOND" },
      third: { text: "THIRD" },
      fourth: { text: "FOURTH" },
    };

    const recordCriteria = {
      first: null,
      third: {},
      second: { field: "value" },
    };

    const hydrated = hydrateUntypedCriteria(recordCriteria, criteriaCopy);
    expect(hydrated).toEqual([
      { text: "FIRST" },
      { text: "SECOND" },
      { text: "THIRD" },
    ]);
  });
});
