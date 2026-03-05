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

import tk from "timekeeper";

import { UsAzTFunction } from "~@jii/translation";
import { ResidentMetadata } from "~datatypes";

import { UsAzImportantDatesPresenter } from "./UsAzImportantDatesPresenter";

const mockAzResidentMetadata: ResidentMetadata<"US_AZ"> = {
  stateCode: "US_AZ",
  acisTprDateRaw: "2024-03-15",
  acisDtpDateRaw: undefined,
  csbdDateRaw: "2024-01-10", // earliest date
  ercdDateRaw: "2024-06-01",
  sedDateRaw: "2024-12-01", // latest date
  csedDateRaw: undefined,
};

const mockAzMetadataAllNullDates: ResidentMetadata<"US_AZ"> = {
  stateCode: "US_AZ",
  acisTprDateRaw: undefined,
  csbdDateRaw: undefined,
  ercdDateRaw: undefined,
  sedDateRaw: undefined,
  csedDateRaw: undefined,
};

// not exactly realistic but lets us test some behavior against all possible dates
const mockAzMetadataWithAllDates: ResidentMetadata<"US_AZ"> = {
  stateCode: "US_AZ",
  acisTprDateRaw: "2024-03-15",
  acisDtpDateRaw: "2024-03-15",
  csbdDateRaw: "2024-01-10",
  trToAddDateRaw: "2024-01-10",
  ercdDateRaw: "2024-06-01",
  addDateRaw: "2024-06-01",
  sedDateRaw: "2024-12-01",
  csedDateRaw: "2024-12-01",
};

const t = vi.fn() as unknown as UsAzTFunction;

const mockNestedObject = (() => {
  const fn = () => mockNestedObject;
  fn.accessed = "";

  return new Proxy(Object.freeze(fn), {
    get: (o, key) => {
      fn.accessed += `.${String(key)}`;
      return mockNestedObject;
    },
  });
})();

describe("UsAzImportantDatesPresenter", () => {
  describe("dateEntries", () => {
    it("sorts dates by earliest first and highlights acisTprDate", () => {
      const presenter = new UsAzImportantDatesPresenter(
        mockAzResidentMetadata,
        t,
      );
      const entries = presenter.dateEntries;

      // Check sorting order
      expect(entries[0].dateKey).toBe("csbdDateRaw");
      expect(entries[0].date).toBe("2024-01-10");

      expect(entries[1].dateKey).toBe("acisTprDateRaw");
      expect(entries[1].date).toBe("2024-03-15");

      expect(entries[2].dateKey).toBe("ercdDateRaw");
      expect(entries[2].date).toBe("2024-06-01");

      expect(entries[3].dateKey).toBe("sedDateRaw");
      expect(entries[3].date).toBe("2024-12-01");

      // Should only include dates that have values
      expect(entries).toHaveLength(4);
    });

    it("handles all null dates correctly", () => {
      const presenter = new UsAzImportantDatesPresenter(
        mockAzMetadataAllNullDates,
        t,
      );
      const entries = presenter.dateEntries;

      expect(entries).toHaveLength(0);
    });

    it("hashlink for each date entry", () => {
      const presenter = new UsAzImportantDatesPresenter(
        mockAzMetadataWithAllDates,
        t,
      );
      const entries = presenter.dateEntries;

      // Verify all entries have the right link URL
      expect(entries.map(({ dateKey, linkUrl }) => ({ dateKey, linkUrl })))
        .toMatchInlineSnapshot(`
          [
            {
              "dateKey": "csbdDateRaw",
              "linkUrl": "more-information/important-dates#csbdDateRaw-trToAddDateRaw",
            },
            {
              "dateKey": "trToAddDateRaw",
              "linkUrl": "more-information/important-dates#csbdDateRaw-trToAddDateRaw",
            },
            {
              "dateKey": "acisDtpDateRaw",
              "linkUrl": "more-information/important-dates#acisDtpDateRaw",
            },
            {
              "dateKey": "ercdDateRaw",
              "linkUrl": "more-information/important-dates#ercdDateRaw-addDateRaw",
            },
            {
              "dateKey": "addDateRaw",
              "linkUrl": "more-information/important-dates#ercdDateRaw-addDateRaw",
            },
            {
              "dateKey": "sedDateRaw",
              "linkUrl": "more-information/important-dates#sedDateRaw",
            },
            {
              "dateKey": "csedDateRaw",
              "linkUrl": "more-information/important-dates#csedDateRaw",
            },
          ]
        `);
    });

    it("includes the current day in upcoming status", () => {
      // this field should be defined
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const mockNow = new Date(mockAzResidentMetadata.csbdDateRaw!);
      // a naked date will be interpreted the start of the day.
      // we want to make sure that doesn't throw off comparisons later in the day
      mockNow.setHours(15, 25);

      tk.freeze(mockNow);

      const presenter = new UsAzImportantDatesPresenter(
        mockAzResidentMetadata,
        t,
      );
      const todayEntry = presenter.dateEntries.find(
        (e) => e.dateKey === "csbdDateRaw",
      );

      expect(todayEntry?.isUpcoming).toBeTrue();

      tk.reset();
    });
  });
});
