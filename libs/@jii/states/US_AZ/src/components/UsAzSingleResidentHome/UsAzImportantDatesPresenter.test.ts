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

import { UsAzResidentContext } from "../UsAzSingleResidentContext/UsAzSingleResidentContext";
import { UsAzImportantDatesPresenter } from "./UsAzImportantDatesPresenter";

const mockActiveDates: UsAzResidentContext["activeDates"] = {
  tprDate: new Date("2024-03-15"),
  dtpDate: undefined,
  csbdDate: new Date("2024-01-10"), // earliest date
  ercdDate: new Date("2024-06-01"),
  sedDate: new Date("2024-12-01"), // latest date
  csedDate: undefined,
  addDate: undefined,
  trToAddDate: undefined,
};

const mockAzMetadataAllNullDates: UsAzResidentContext["activeDates"] = {
  tprDate: undefined,
  csbdDate: undefined,
  ercdDate: undefined,
  sedDate: undefined,
  csedDate: undefined,
  addDate: undefined,
  dtpDate: undefined,
  trToAddDate: undefined,
};

// not exactly realistic but lets us test some behavior against all possible dates
const mockAzMetadataWithAllDates: UsAzResidentContext["activeDates"] = {
  tprDate: new Date("2024-03-15"),
  dtpDate: new Date("2024-03-15"),
  csbdDate: new Date("2024-01-10"),
  trToAddDate: new Date("2024-01-10"),
  ercdDate: new Date("2024-06-01"),
  addDate: new Date("2024-06-01"),
  sedDate: new Date("2024-12-01"),
  csedDate: new Date("2024-12-01"),
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
      const presenter = new UsAzImportantDatesPresenter(mockActiveDates, t);
      const entries = presenter.dateEntries;

      // Check sorting order
      expect(entries[0].dateKey).toBe("csbdDate");
      expect(entries[0].date).toEqual(new Date("2024-01-10"));

      expect(entries[1].dateKey).toBe("tprDate");
      expect(entries[1].date).toEqual(new Date("2024-03-15"));

      expect(entries[2].dateKey).toBe("ercdDate");
      expect(entries[2].date).toEqual(new Date("2024-06-01"));

      expect(entries[3].dateKey).toBe("sedDate");
      expect(entries[3].date).toEqual(new Date("2024-12-01"));

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
              "dateKey": "csbdDate",
              "linkUrl": "more-information/important-dates#csbdDate-trToAddDate",
            },
            {
              "dateKey": "trToAddDate",
              "linkUrl": "more-information/important-dates#csbdDate-trToAddDate",
            },
            {
              "dateKey": "dtpDate",
              "linkUrl": "more-information/important-dates#dtpDate",
            },
            {
              "dateKey": "ercdDate",
              "linkUrl": "more-information/important-dates#ercdDate-addDate",
            },
            {
              "dateKey": "addDate",
              "linkUrl": "more-information/important-dates#ercdDate-addDate",
            },
            {
              "dateKey": "sedDate",
              "linkUrl": "more-information/important-dates#sedDate",
            },
            {
              "dateKey": "csedDate",
              "linkUrl": "more-information/important-dates#csedDate",
            },
          ]
        `);
    });

    it("includes the current day in upcoming status", () => {
      // this field should be defined
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const mockNow = new Date(mockActiveDates.csbdDate!);
      // a naked date will be interpreted the start of the day.
      // we want to make sure that doesn't throw off comparisons later in the day
      mockNow.setHours(15, 25);

      tk.freeze(mockNow);

      const presenter = new UsAzImportantDatesPresenter(mockActiveDates, t);
      const todayEntry = presenter.dateEntries.find(
        (e) => e.dateKey === "csbdDate",
      );

      expect(todayEntry?.isUpcoming).toBeTrue();

      tk.reset();
    });
  });
});
