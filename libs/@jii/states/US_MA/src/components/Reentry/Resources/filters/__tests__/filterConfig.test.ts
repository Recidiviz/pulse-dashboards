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

import { loadUsMaTranslations } from "../../__tests__/testUtils";
import { FILTER_GROUPS, parseSelectedFilters } from "../filterConfig";

describe("parseSelectedFilters", () => {
  test("selects nothing without params", () => {
    expect(parseSelectedFilters({ rent: [] })).toEqual({ rent: [] });
  });

  test("maps rent IDs to options", () => {
    expect(
      parseSelectedFilters({ rent: ["free", "upTo150", "notListed"] }),
    ).toEqual({
      rent: [
        { kind: "free" },
        { kind: "band", band: { gt: 0, lte: 150 } },
        { kind: "notListed" },
      ],
    });
  });

  test("drops IDs that aren't in the config", () => {
    expect(parseSelectedFilters({ rent: ["cheap", "over200"] })).toEqual({
      rent: [{ kind: "band", band: { gt: 200 } }],
    });
  });
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
