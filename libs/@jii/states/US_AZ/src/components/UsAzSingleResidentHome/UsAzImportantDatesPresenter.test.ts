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

import { UsAzDisplayedDates } from "../UsAzSingleResidentContext/SingleResidentContextPresenter";
import { UsAzImportantDatesPresenter } from "./UsAzImportantDatesPresenter";

const mockSomeDates: UsAzDisplayedDates = [
  { dateKey: "tprDate", date: new Date("2024-03-15") },
  { dateKey: "csbdDate", date: new Date("2024-01-10") }, // earliest date
  { dateKey: "ercdDate", date: new Date("2024-06-01") },
  { dateKey: "sedDate", date: new Date("2024-12-01") }, // latest date
];

const mockNoDates: UsAzDisplayedDates = [];

// not exactly realistic but lets us test some behavior against all possible dates
const mockAllDates: UsAzDisplayedDates = [
  { dateKey: "tprDate", date: new Date("2024-03-15") },
  { dateKey: "dtpDate", date: new Date("2024-03-15") },
  { dateKey: "csbdDate", date: new Date("2024-01-10") },
  { dateKey: "trToAddDate", date: new Date("2024-01-10") },
  { dateKey: "ercdDate", date: new Date("2024-06-01") },
  { dateKey: "addDate", date: new Date("2024-06-01") },
  { dateKey: "sedDate", date: new Date("2024-12-01") },
  { dateKey: "csedDate", date: new Date("2024-12-01") },
];

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
    it("sorts dates by earliest first", () => {
      const presenter = new UsAzImportantDatesPresenter(mockSomeDates, t);
      const entries = presenter.dateEntries;

      expect(entries).toHaveLength(4);

      // Check sorting order
      expect(entries[0].dateKey).toBe("csbdDate");
      expect(entries[0].date).toEqual(new Date("2024-01-10"));

      expect(entries[1].dateKey).toBe("tprDate");
      expect(entries[1].date).toEqual(new Date("2024-03-15"));

      expect(entries[2].dateKey).toBe("ercdDate");
      expect(entries[2].date).toEqual(new Date("2024-06-01"));

      expect(entries[3].dateKey).toBe("sedDate");
      expect(entries[3].date).toEqual(new Date("2024-12-01"));
    });

    it("passes through nothing when given no dates", () => {
      const presenter = new UsAzImportantDatesPresenter(mockNoDates, t);
      const entries = presenter.dateEntries;

      expect(entries).toHaveLength(0);
    });

    it("creates the right hashlink for each date entry", () => {
      const presenter = new UsAzImportantDatesPresenter(mockAllDates, t);
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
              "dateKey": "tprDate",
              "linkUrl": "more-information/important-dates#tprDate",
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

    describe("highlightType", () => {
      beforeEach(() => tk.freeze(new Date("2024-01-01")));
      afterEach(() => tk.reset());

      const futureTpr: UsAzDisplayedDates = [
        { dateKey: "tprDate", date: new Date("2024-06-01") },
      ];
      const futureDtp: UsAzDisplayedDates = [
        { dateKey: "dtpDate", date: new Date("2024-06-01") },
      ];

      it("is green for an approved future TPR date", () => {
        const entry = new UsAzImportantDatesPresenter(futureTpr, t, {
          isTprApproved: true,
          isDtpApproved: false,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.highlightType).toBe("green");
      });

      it("is dashed for a tentative future TPR date", () => {
        const entry = new UsAzImportantDatesPresenter(futureTpr, t, {
          isTprApproved: false,
          isDtpApproved: false,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.highlightType).toBe("dashed");
      });

      it("is dashed for a past TPR date even when approved", () => {
        const pastTpr: UsAzDisplayedDates = [
          { dateKey: "tprDate", date: new Date("2023-06-01") },
        ];
        const entry = new UsAzImportantDatesPresenter(pastTpr, t, {
          isTprApproved: true,
          isDtpApproved: false,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.highlightType).toBe("dashed");
      });

      it("is purple for an approved future DTP date", () => {
        const entry = new UsAzImportantDatesPresenter(futureDtp, t, {
          isTprApproved: false,
          isDtpApproved: true,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.highlightType).toBe("purple");
      });

      it("is dashed for a tentative future DTP date", () => {
        const entry = new UsAzImportantDatesPresenter(futureDtp, t, {
          isTprApproved: false,
          isDtpApproved: false,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.highlightType).toBe("dashed");
      });

      it("is undefined for non-approvable dates", () => {
        const ercd: UsAzDisplayedDates = [
          { dateKey: "ercdDate", date: new Date("2024-06-01") },
        ];
        const entry = new UsAzImportantDatesPresenter(ercd, t, {
          isTprApproved: true,
          isDtpApproved: true,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.highlightType).toBeUndefined();
      });

      it("is green for a TPR date when usAzFslImprovements is off", () => {
        const entry = new UsAzImportantDatesPresenter(futureTpr, t, {
          isTprApproved: false,
          isDtpApproved: false,
        }).dateEntries[0];
        expect(entry.highlightType).toBe("green");
      });
    });

    describe("isTentative", () => {
      beforeEach(() => tk.freeze(new Date("2024-01-01")));
      afterEach(() => tk.reset());

      const futureTpr: UsAzDisplayedDates = [
        { dateKey: "tprDate", date: new Date("2024-06-01") },
      ];

      it("is true for an unapproved future TPR date", () => {
        const entry = new UsAzImportantDatesPresenter(futureTpr, t, {
          isTprApproved: false,
          isDtpApproved: false,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.isTentative).toBeTrue();
      });

      it("is false for an approved future TPR date", () => {
        const entry = new UsAzImportantDatesPresenter(futureTpr, t, {
          isTprApproved: true,
          isDtpApproved: false,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.isTentative).toBeFalse();
      });

      it("is false for non-approvable dates", () => {
        const ercd: UsAzDisplayedDates = [
          { dateKey: "ercdDate", date: new Date("2024-06-01") },
        ];
        const entry = new UsAzImportantDatesPresenter(ercd, t, {
          isTprApproved: true,
          isDtpApproved: true,
          usAzFslImprovements: true,
        }).dateEntries[0];
        expect(entry.isTentative).toBeFalse();
      });

      it("is false when usAzFslImprovements is off", () => {
        const entry = new UsAzImportantDatesPresenter(futureTpr, t, {
          isTprApproved: false,
          isDtpApproved: false,
        }).dateEntries[0];
        expect(entry.isTentative).toBeFalse();
      });
    });

    describe("overlay", () => {
      it("is undefined when usAzFslImprovements is off", () => {
        tk.freeze(new Date("2024-01-01"));
        const entry = new UsAzImportantDatesPresenter(
          [{ dateKey: "tprDate", date: new Date("2024-06-01") }],
          t,
          { isTprApproved: false, isDtpApproved: false },
        ).dateEntries[0];
        tk.reset();
        expect(entry.overlay).toBeUndefined();
      });
    });

    it("includes the current day in upcoming status", () => {
      const mockNow = new Date(
        // this field should be defined
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        mockSomeDates.find(({ dateKey }) => dateKey === "csbdDate")!.date,
      );
      // a naked date will be interpreted as the start of the day.
      // we want to make sure that doesn't throw off comparisons later in the day
      mockNow.setHours(15, 25);

      tk.freeze(mockNow);

      const presenter = new UsAzImportantDatesPresenter(mockSomeDates, t);
      const todayEntry = presenter.dateEntries.find(
        (e) => e.dateKey === "csbdDate",
      );

      expect(todayEntry?.isUpcoming).toBeTrue();

      tk.reset();
    });
  });
});
