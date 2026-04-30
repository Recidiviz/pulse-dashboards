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

import { TFunction } from "i18next";

import {
  copyFixtureEnglish,
  prepareUsOzTranslations,
} from "../../fixtures/copy";
import {
  DateGenerator,
  getDatesWithMissing,
  getDatesWithPast,
  getDatesWithUpcoming,
  getDefaultDates,
  getSentenceDatesFixtureData,
} from "../../fixtures/data";
import { DatePresenter } from "./DatePresenter";
import { StateCodeWithSentenceDates } from "./types";

describe("DatePresenter", () => {
  let t: TFunction<[StateCodeWithSentenceDates, "common"]>;
  let presenter: DatePresenter;

  beforeEach(async () => {
    const i18n = prepareUsOzTranslations();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15));
    await i18n.reloadResources(["en", "es"], ["common"]);
    t = i18n.getFixedT("en", ["US_OZ", "common"]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getPresenter(datesFn: DateGenerator, index = 0) {
    const { dates } = getSentenceDatesFixtureData(datesFn);

    return new DatePresenter(dates[index], t);
  }

  describe("past date", () => {
    beforeEach(() => {
      presenter = getPresenter(getDatesWithPast);
    });

    it("is marked as past", () => {
      expect(presenter.cardModifierClasses).toEqual(["DateCard--is-past"]);
    });

    it("returns the correct label and description", () => {
      expect(presenter.cardLabelText).toMatchInlineSnapshot(
        `"Parole Eligibility Date"`,
      );
      expect(presenter.cardDescriptionText).toMatchInlineSnapshot(
        `"The earliest date you are eligible to be considered for release on parole."`,
      );
    });

    it("shows formatted date as primary value and relative as supplemental", () => {
      expect(presenter.cardValueText).toMatchInlineSnapshot(`
        {
          "primary": "April 8, 2026",
          "supplemental": "7 days ago",
        }
      `);
    });
  });

  describe("upcoming date", () => {
    beforeEach(() => {
      presenter = getPresenter(getDatesWithUpcoming);
    });

    it("is marked as upcoming", () => {
      expect(presenter.cardModifierClasses).toEqual(["DateCard--is-upcoming"]);
    });

    it("shows relative date as primary value and formatted as supplemental", () => {
      expect(presenter.cardValueText).toMatchInlineSnapshot(`
        {
          "primary": "23 days from today",
          "supplemental": "May 8, 2026",
        }
      `);
    });
  });

  describe("missing date (parole_eligibility_date)", () => {
    beforeEach(() => {
      presenter = getPresenter(getDatesWithMissing);
    });

    it("has no modifier classes", () => {
      expect(presenter.cardModifierClasses).toEqual([]);
    });

    it("shows the missing date message with no supplemental value", () => {
      expect(presenter.cardValueText).toMatchInlineSnapshot(`
        {
          "primary": "No date on record",
          "supplemental": undefined,
        }
      `);
    });
  });

  describe("future non-upcoming date", () => {
    beforeEach(() => {
      presenter = getPresenter(getDefaultDates);
    });

    it("has no modifier classes", () => {
      expect(presenter.cardModifierClasses).toEqual([]);
    });

    it("shows formatted date as primary value and relative as supplemental", () => {
      expect(presenter.cardValueText).toMatchInlineSnapshot(`
        {
          "primary": "July 19, 2026",
          "supplemental": "3 months and 4 days from today",
        }
      `);
    });
  });

  it("returns undefined for cardDescriptionText when the date has no description", async () => {
    const i18n = prepareUsOzTranslations({
      englishCopy: {
        sentenceDates: {
          ...copyFixtureEnglish.sentenceDates,
          dates: {
            ...copyFixtureEnglish.sentenceDates.dates,
            // dropping description field from this fixture
            parole_eligibility_date: { label: "Earliest Release Date" },
          },
        },
      },
    });
    await i18n.reloadResources(["en"], ["common"]);
    t = i18n.getFixedT("en", ["US_OZ", "common"]);

    const presenter = getPresenter(getDefaultDates);

    expect(presenter.cardDescriptionText).toBeUndefined();
  });
});
