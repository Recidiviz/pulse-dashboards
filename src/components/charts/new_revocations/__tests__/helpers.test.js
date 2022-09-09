// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import { applyTopLevelFilters } from "../helpers";

describe("applyTopLevelFilters", () => {
  let filters = {};
  let filtered = [];
  let data = [];

  beforeEach(() => {
    data = [
      {
        charge_category: "ALL",
        district: "ALL",
        month: "1",
        reported_violations: "1",
        state_code: "US_PA",
        supervision_level: "ALL",
        supervision_type: "PAROLE",
        total_revocations: "35",
        violation_type: "MED_TECH",
        year: "2020",
      },
      {
        charge_category: "ALL",
        district: "ALL",
        month: "1",
        reported_violations: "1",
        state_code: "US_PA",
        supervision_level: "MEDIUM",
        supervision_type: "PAROLE",
        total_revocations: "5",
        violation_type: "MED_TECH",
        year: "2020",
      },
      {
        charge_category: "ALL",
        district: "ALL",
        month: "1",
        reported_violations: "1",
        state_code: "US_PA",
        supervision_level: "MEDIUM",
        supervision_type: "PAROLE",
        total_revocations: "10",
        violation_type: "MED_TECH",
        year: "2020",
      },
      {
        charge_category: "ALL",
        district: "ALL",
        month: "1",
        reported_violations: "1",
        state_code: "US_PA",
        supervision_level: "MINIMUM",
        supervision_type: "PAROLE",
        total_revocations: "20",
        violation_type: "MED_TECH",
        year: "2020",
      },
    ];
  });

  describe("supervisionLevel filter", () => {
    describe("with supervisionLevel = 'MEDIUM' filter applied", () => {
      beforeEach(() => {
        filters = { supervisionLevel: "MEDIUM" };
        filtered = applyTopLevelFilters(filters)(data);
      });

      it("correctly returns supervision_level items matching the filter term", () => {
        const expected = [data[1], data[2]];

        expect(filtered).toEqual(expected);
      });

      it("does not double count the 'ALL' item", () => {
        expect(filtered).not.toContain(data[0]);
      });
    });

    describe("with supervisionLevel = 'ALL' filter applied", () => {
      beforeEach(() => {
        filters = { supervisionLevel: "ALL" };
        filtered = applyTopLevelFilters(filters)(data);
      });

      it("returns the 'ALL' row", () => {
        const expected = [data[0]];
        expect(filtered).toEqual(expected);
      });
    });

    describe("when the filters do not include supervisionLevel attribute", () => {
      beforeEach(() => {
        filters = {};
        filtered = applyTopLevelFilters(filters)(data);
      });

      it("returns the input data", () => {
        expect(filtered).toEqual(data);
      });
    });

    describe("when the data item does not have the supervision_level attribute", () => {
      let missingAttributeData;

      beforeEach(() => {
        missingAttributeData = data.map((i) => {
          /* eslint-disable camelcase */
          const { supervision_level, ...item } = i;
          return item;
        });
        filters = { supervisionLevel: "ALL" };
        filtered = applyTopLevelFilters(filters)(missingAttributeData);
      });

      it("returns all of the rows", () => {
        expect(filtered).toEqual(missingAttributeData);
      });
    });
  });
});
