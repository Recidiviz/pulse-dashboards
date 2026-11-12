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

import type { CurrentPatternRow } from "~@parole-board/common";
import { addMonthChoices } from "~@parole-board/common/fixtures";

import { countLocations, facilityPatternRows } from "../facilityPatternRows";

const { currentPatterns, config } = addMonthChoices;

describe("facilityPatternRows", () => {
  it("names locations by label and full name and words their rules, in server order", () => {
    const rows = facilityPatternRows(currentPatterns, config.resources);

    expect(rows).toHaveLength(39);
    expect(rows[0]).toEqual({
      id: "HEARING:FCF",
      fullName: "FCF — Fremont",
      days: "1st and 2nd Monday",
    });
    expect(rows.slice(-2)).toEqual([
      { id: "FULL_BOARD", fullName: "Full Board", days: "Every Friday" },
      { id: "BUSINESS_MEETING", fullName: "Business Mtg", days: null },
    ]);
  });

  it("uses the label alone for a location with no full name", () => {
    const [fcf] = currentPatterns;
    const resources = config.resources.map((resource) =>
      resource.id === fcf.resource?.id ? { ...resource, name: null } : resource,
    );

    expect(facilityPatternRows([fcf], resources)[0].fullName).toBe("FCF");
    expect(facilityPatternRows([fcf], [])[0].fullName).toBe("FCF");
  });

  it("words mixed rules one by one", () => {
    const row: CurrentPatternRow = {
      ...currentPatterns[0],
      pattern: currentPatterns[0].pattern && {
        ...currentPatterns[0].pattern,
        rules: [
          { type: "weekOfMonth", week: 2, weekday: "MONDAY" },
          { type: "everyWeekday", weekday: "FRIDAY" },
        ],
      },
    };

    expect(facilityPatternRows([row], config.resources)[0].days).toBe(
      "2nd Monday, Every Friday",
    );
  });
});

describe("countLocations", () => {
  it("counts rows with a resource and leaves out meeting kinds", () => {
    expect(countLocations(currentPatterns)).toBe(37);
    expect(countLocations([])).toBe(0);
  });
});
