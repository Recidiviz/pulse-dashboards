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
        supervision_type: "ALL",
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
        supervision_type: "PROBATION",
        total_revocations: "20",
        violation_type: "MED_TECH",
        year: "2020",
      },
    ];
  });

  describe("supervisionLevel filter", () => {
    let filteredSupervisionLevels = [];

    describe("with supervisionLevel = 'MEDIUM' filter applied", () => {
      beforeEach(() => {
        filters = { supervisionLevel: "MEDIUM" };
        filtered = applyTopLevelFilters(filters)(data);
        filteredSupervisionLevels = filtered.map((f) => f.supervision_level);
      });

      it("correctly returns supervision_level items matching the filter term", () => {
        const expected = ["MEDIUM", "MEDIUM"];

        expect(filteredSupervisionLevels).toEqual(expected);
      });

      it("does not double count the 'ALL' item", () => {
        expect(filteredSupervisionLevels).not.toContain("ALL");
      });
    });

    describe("with supervisionLevel = 'ALL' filter applied", () => {
      beforeEach(() => {
        filters = { supervisionLevel: "ALL" };
        filtered = applyTopLevelFilters(filters)(data);
        filteredSupervisionLevels = filtered.map((f) => f.supervision_level);
      });

      it("returns the 'ALL' row", () => {
        const expected = ["ALL"];

        expect(filteredSupervisionLevels).toEqual(expected);
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

    // This is the case for the CaseTable because the
    // revocations_matrix_filtered_caseload endpoint does not include 'ALL' rows
    describe("when the treatCategoryAllAsAbsent flag is true", () => {
      let missingCategoryAllData;
      const treatCategoryAllAsAbsent = true;

      beforeEach(() => {
        missingCategoryAllData = data.slice(1);
        filters = { supervisionLevel: "ALL" };
        filtered = applyTopLevelFilters(filters)(
          missingCategoryAllData,
          [],
          treatCategoryAllAsAbsent
        );
      });

      it("returns all of the rows", () => {
        expect(filtered).toEqual(missingCategoryAllData);
      });

      describe("when an item supervision_level is null", () => {
        beforeEach(() => {
          missingCategoryAllData.push({
            charge_category: "NOT_ALL",
            district: "NOT_ALL",
            month: "1",
            reported_violations: "1",
            state_code: "US_PA",
            supervision_level: null,
            supervision_type: "PAROLE",
            total_revocations: "20",
            violation_type: "MED_TECH",
            year: "2020",
          });
        });

        // The only time a null should pass through a filter is when
        // treatCategoryAllAsAbsent = true and the filter = 'ALL'
        describe("with supervisionLevel = 'ALL' filter applied", () => {
          beforeEach(() => {
            filters = { supervisionLevel: "ALL" };
            filtered = applyTopLevelFilters(filters)(
              missingCategoryAllData,
              [],
              treatCategoryAllAsAbsent
            );
            filteredSupervisionLevels = filtered.map(
              (f) => f.supervision_level
            );
          });

          it("returns the all of the rows including the null row", () => {
            const expected = ["MEDIUM", "MEDIUM", "MINIMUM", null];
            expect(filteredSupervisionLevels).toEqual(expected);
          });
        });

        // Even with treatCategoryAllAsAbsent = true, do not pass nulls through
        // if the supervisionLevel filter is not 'ALL'
        describe("with supervisionLevel = 'MEDIUM' filter applied", () => {
          beforeEach(() => {
            filters = { supervisionLevel: "MEDIUM" };
            filtered = applyTopLevelFilters(filters)(
              missingCategoryAllData,
              [],
              treatCategoryAllAsAbsent
            );
            filteredSupervisionLevels = filtered.map(
              (f) => f.supervision_level
            );
          });

          it("returns only the rows matching the filter", () => {
            const expected = ["MEDIUM", "MEDIUM"];
            expect(filteredSupervisionLevels).toEqual(expected);
          });
        });
      });
    });

    // When treatCategoryAllAsAbsent is false, never let nulls pass through
    // the filter
    describe("when the treatCategoryAllAsAbsent flag is false", () => {
      const treatCategoryAllAsAbsent = false;

      describe("when an item supervision_level is null", () => {
        beforeAll(() => {
          data.push({
            charge_category: "ALL",
            district: "ALL",
            month: "1",
            reported_violations: "1",
            state_code: "US_PA",
            supervision_level: null,
            supervision_type: "PAROLE",
            total_revocations: "20",
            violation_type: "MED_TECH",
            year: "2020",
          });
        });

        describe("with supervisionLevel = 'ALL' filter applied", () => {
          beforeEach(() => {
            filters = { supervisionLevel: "ALL" };
            filtered = applyTopLevelFilters(filters)(
              data,
              [],
              treatCategoryAllAsAbsent
            );
            filteredSupervisionLevels = filtered.map(
              (f) => f.supervision_level
            );
          });

          it("returns only the 'ALL' row", () => {
            const expected = ["ALL"];
            expect(filteredSupervisionLevels).toEqual(expected);
          });
        });

        describe("with supervisionLevel = 'MEDIUM' filter applied", () => {
          beforeEach(() => {
            filters = { supervisionLevel: "MEDIUM" };
            filtered = applyTopLevelFilters(filters)(
              data,
              [],
              treatCategoryAllAsAbsent
            );
            filteredSupervisionLevels = filtered.map(
              (f) => f.supervision_level
            );
          });

          it("returns only the rows matching the filter", () => {
            const expected = ["MEDIUM", "MEDIUM"];
            expect(filteredSupervisionLevels).toEqual(expected);
          });
        });
      });
    });
  });
});
