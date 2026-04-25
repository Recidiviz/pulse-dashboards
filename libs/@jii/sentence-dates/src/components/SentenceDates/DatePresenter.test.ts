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
import { getSentenceDatesFixtureData } from "../../fixtures/data";
import { DatePresenter } from "./DatePresenter";
import { StateCodeWithSentenceDates } from "./types";

describe("DatePresenter", () => {
  let t: TFunction<[StateCodeWithSentenceDates, "common"]>;

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

  function getPresenter(id: string) {
    const { dates } = getSentenceDatesFixtureData();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new DatePresenter(dates.find((d) => d.id === id)!, t);
  }

  describe("past date (earliest_release_date)", () => {
    it("is marked as past", () => {
      expect(getPresenter("earliest_release_date").cardModifierClasses).toEqual(
        ["DateCard--is-past"],
      );
    });

    it("returns the correct label and description", () => {
      const presenter = getPresenter("earliest_release_date");
      expect(presenter.cardLabelText).toMatchInlineSnapshot(
        `"Earliest Release Date"`,
      );
      expect(presenter.cardDescriptionText).toMatchInlineSnapshot(
        `"The earliest date you can be released from incarceration."`,
      );
    });

    it("shows formatted date as primary value and relative as supplemental", () => {
      expect(getPresenter("earliest_release_date").cardValueText)
        .toMatchInlineSnapshot(`
        {
          "primary": "March 16, 2026",
          "supplemental": "30 days ago",
        }
      `);
    });
  });

  describe("upcoming date (projected_release_date)", () => {
    it("is marked as upcoming", () => {
      expect(
        getPresenter("projected_release_date").cardModifierClasses,
      ).toEqual(["DateCard--is-upcoming"]);
    });

    it("shows relative date as primary value and formatted as supplemental", () => {
      expect(getPresenter("projected_release_date").cardValueText)
        .toMatchInlineSnapshot(`
        {
          "primary": "7 days from today",
          "supplemental": "April 22, 2026",
        }
      `);
    });
  });

  describe("missing date (parole_eligibility_date)", () => {
    it("has no modifier classes", () => {
      expect(
        getPresenter("parole_eligibility_date").cardModifierClasses,
      ).toEqual([]);
    });

    it("shows the missing date message with no supplemental value", () => {
      expect(getPresenter("parole_eligibility_date").cardValueText)
        .toMatchInlineSnapshot(`
        {
          "primary": "No date on record",
          "supplemental": undefined,
        }
      `);
    });
  });

  describe("future non-upcoming date (max_discharge_date)", () => {
    it("has no modifier classes", () => {
      expect(getPresenter("max_discharge_date").cardModifierClasses).toEqual(
        [],
      );
    });

    it("shows formatted date as primary value and relative as supplemental", () => {
      expect(getPresenter("max_discharge_date").cardValueText)
        .toMatchInlineSnapshot(`
        {
          "primary": "May 20, 2027",
          "supplemental": "1 year and 1 month from today",
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
            earliest_release_date: { label: "Earliest Release Date" },
          },
        },
      },
    });
    await i18n.reloadResources(["en"], ["common"]);
    t = i18n.getFixedT("en", ["US_OZ", "common"]);
    const presenter = getPresenter("earliest_release_date");

    expect(presenter.cardDescriptionText).toBeUndefined();
  });
});
