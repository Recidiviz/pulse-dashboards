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

const mockMarkdownContent = `## H0\n## H1\n## H2\n## H3\n## H4\n## H5\n## H6`;

const mockAzResident = {
  stateCode: "US_AZ",
  metadata: {
    stateCode: "US_AZ",
    acisTprDateRaw: "2024-03-15",
    acisDtpDateRaw: undefined,
    csbdDateRaw: "2024-01-10", // earliest date
    ercdDateRaw: "2024-06-01",
    sedDateRaw: "2024-12-01", // latest date
    csedDateRaw: undefined,
  },
} as never as ResidentRecord;

const mockAzResidentAllNullDates = {
  stateCode: "US_AZ",
  metadata: {
    stateCode: "US_AZ",
    acisTprDateRaw: undefined,
    csbdDateRaw: undefined,
    ercdDateRaw: undefined,
    sedDateRaw: undefined,
    csedDateRaw: undefined,
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
      const presenter = new UsAzImportantDatesPresenter(
        mockAzResident,
        mockMarkdownContent,
      );
      expect(presenter.metadata).toEqual(mockAzResident.metadata);
    });

    it("throws an error when the state code is not US_AZ", () => {
      const presenter = new UsAzImportantDatesPresenter(
        mockCaResident,
        mockMarkdownContent,
      );
      expect(() => presenter.metadata).toThrow(
        "Invalid state code for UsAzImportantDatesPresenter: US_CA",
      );
    });
  });

  describe("dateEntries", () => {
    it("sorts dates by earliest first and highlights acisTprDate", () => {
      const presenter = new UsAzImportantDatesPresenter(
        mockAzResident,
        mockMarkdownContent,
      );
      const entries = presenter.dateEntries;

      // Check sorting order
      expect(entries[0].key).toBe("csbdDateRaw");
      expect(entries[0].date).toBe("2024-01-10");
      expect(entries[0].highlightType).toBeUndefined();

      expect(entries[1].key).toBe("acisTprDateRaw");
      expect(entries[1].date).toBe("2024-03-15");
      expect(entries[1].highlightType).toBe("acisTprDateRaw");

      expect(entries[2].key).toBe("ercdDateRaw");
      expect(entries[2].date).toBe("2024-06-01");
      expect(entries[2].highlightType).toBeUndefined();

      expect(entries[3].key).toBe("sedDateRaw");
      expect(entries[3].date).toBe("2024-12-01");
      expect(entries[3].highlightType).toBeUndefined();

      // Should only include dates that have values
      expect(entries).toHaveLength(4);
    });

    it("handles all null dates correctly", () => {
      const presenter = new UsAzImportantDatesPresenter(
        mockAzResidentAllNullDates,
        mockMarkdownContent,
      );
      const entries = presenter.dateEntries;

      expect(entries).toHaveLength(0);
    });

    it("assigns infoPageHash to each date entry", () => {
      const presenter = new UsAzImportantDatesPresenter(
        mockAzResident,
        mockMarkdownContent,
      );
      const entries = presenter.dateEntries;

      // Verify all entries have an infoPageHash
      entries.forEach((entry) => {
        expect(entry.infoPageHash).toBeTruthy();
        expect(typeof entry.infoPageHash).toBe("string");
      });
    });
  });
});
