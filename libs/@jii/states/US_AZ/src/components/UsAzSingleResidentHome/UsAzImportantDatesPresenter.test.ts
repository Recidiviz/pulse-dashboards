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
    acisTprDate: "2024-03-15",
    csbdDate: "2024-01-10", // earliest date
    ercdDate: "2024-06-01",
    sedDate: "2024-12-01", // latest date
    csedDate: undefined, // null date
  },
} as never as ResidentRecord;

const mockAzResidentAllNullDates = {
  stateCode: "US_AZ",
  metadata: {
    stateCode: "US_AZ",
    acisTprDate: undefined,
    csbdDate: undefined,
    ercdDate: undefined,
    sedDate: undefined,
    csedDate: undefined,
  },
} as never as ResidentRecord;

const mockCaResident = {
  stateCode: "US_CA",
  metadata: {
    stateCode: "US_CA",
  },
} as never as ResidentRecord;

describe("UsAzImportantDatesPresenter", () => {
  describe("metadata", () => {
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

  describe("dateEntries", () => {
    it("sorts dates by earliest first and highlights the first valid date", () => {
      const presenter = new UsAzImportantDatesPresenter(mockAzResident);
      const entries = presenter.dateEntries;

      // Check sorting order
      expect(entries[0].key).toBe("csbdDate");
      expect(entries[0].date).toBe("2024-01-10");
      expect(entries[0].isHighlighted).toBe(true); // First valid date should be highlighted

      expect(entries[1].key).toBe("acisTprDate");
      expect(entries[1].date).toBe("2024-03-15");
      expect(entries[1].isHighlighted).toBe(false);

      expect(entries[2].key).toBe("ercdDate");
      expect(entries[2].date).toBe("2024-06-01");
      expect(entries[2].isHighlighted).toBe(false);

      expect(entries[3].key).toBe("sedDate");
      expect(entries[3].date).toBe("2024-12-01");
      expect(entries[3].isHighlighted).toBe(false);

      // Null dates should come last
      expect(entries[4].key).toBe("csedDate");
      expect(entries[4].date).toBeUndefined();
      expect(entries[4].isHighlighted).toBe(false);
    });

    it("handles all null dates correctly", () => {
      const presenter = new UsAzImportantDatesPresenter(
        mockAzResidentAllNullDates,
      );
      const entries = presenter.dateEntries;

      expect(entries).toHaveLength(5);

      // All dates should be undefined
      entries.forEach((entry) => {
        expect(entry.date).toBeUndefined();
        expect(entry.isHighlighted).toBe(false); // No highlighting when no valid dates
      });
    });
  });
});
