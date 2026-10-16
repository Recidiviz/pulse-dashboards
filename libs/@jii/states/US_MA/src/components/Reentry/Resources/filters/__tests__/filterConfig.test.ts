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

import { loadUsMaTranslations, rentFilters } from "../../__tests__/testUtils";
import {
  countSelectedOptions,
  FILTER_GROUPS,
  getAppliedOptions,
  isSameSelection,
  parseSelectedFilters,
  toggleOption,
  toSearchParams,
} from "../filterConfig";

const [FREE, OVER_200] = rentFilters("free", "over200").rent;

describe("parseSelectedFilters", () => {
  test("selects nothing without params", () => {
    expect(parseSelectedFilters({ rent: [] })).toEqual({ rent: [] });
  });

  test("maps rent IDs to options, in config order", () => {
    expect(
      parseSelectedFilters({ rent: ["notListed", "free", "upTo150"] }),
    ).toEqual(rentFilters("free", "upTo150", "notListed"));
  });

  test("drops IDs that aren't in the config", () => {
    expect(parseSelectedFilters({ rent: ["cheap", "over200"] })).toEqual(
      rentFilters("over200"),
    );
  });
});

test("toSearchParams maps options back to their IDs", () => {
  expect(toSearchParams(rentFilters("over200", "free"))).toEqual({
    rent: ["over200", "free"],
  });
});

describe("getAppliedOptions", () => {
  test("returns the selected options in config order, with their param and key", () => {
    expect(
      getAppliedOptions(rentFilters("over200", "free")).map(
        ({ key, param, option }) => [key, param, option.id],
      ),
    ).toEqual([
      ["rent:free", "rent", "free"],
      ["rent:over200", "rent", "over200"],
    ]);
  });
});

describe("toggleOption", () => {
  test("adds an unselected option", () => {
    expect(toggleOption(rentFilters("free"), "rent", OVER_200)).toEqual(
      rentFilters("free", "over200"),
    );
  });

  test("removes a selected option", () => {
    expect(toggleOption(rentFilters("free", "over200"), "rent", FREE)).toEqual(
      rentFilters("over200"),
    );
  });
});

describe("isSameSelection", () => {
  test.each([
    [[], [], true],
    [["free", "over200"], ["over200", "free"], true],
    [["free"], [], false],
    [["free"], ["over200"], false],
  ])("%j and %j is %s", (a, b, expected) => {
    expect(isSameSelection(rentFilters(...a), rentFilters(...b))).toBe(
      expected,
    );
  });
});

test("countSelectedOptions counts options across groups", () => {
  expect(countSelectedOptions(rentFilters("free", "over200"))).toBe(2);
});

describe("FILTER_GROUPS", () => {
  test("every group and option has a label", async () => {
    const t = await loadUsMaTranslations();

    for (const group of FILTER_GROUPS) {
      expect(group.label(t)).not.toMatch(/reentry\./);
      for (const option of group.options) {
        expect(option.label(t)).not.toMatch(/reentry\./);
      }
    }
  });

  test("option IDs are unique within each group", () => {
    for (const { options } of FILTER_GROUPS) {
      const ids = options.map((option) => option.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
