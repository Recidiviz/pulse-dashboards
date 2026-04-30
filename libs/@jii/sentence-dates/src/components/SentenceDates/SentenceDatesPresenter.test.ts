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

import { SentenceDatesData } from "../../data/types";
import {
  copyFixtureEnglishWithCustomHeading,
  copyFixtureSpanish,
  prepareUsOzTranslations,
} from "../../fixtures/copy";
import { getSentenceDatesFixtureData } from "../../fixtures/data";
import { SentenceDatesPresenter } from "./SentenceDatesPresenter";
import { StateCodeWithSentenceDates } from "./types";

describe("SentenceDatesPresenter", () => {
  let i18n: ReturnType<typeof prepareUsOzTranslations>;
  let t: TFunction<[StateCodeWithSentenceDates, "common"]>;
  let sentenceDatesFixture: SentenceDatesData;

  beforeEach(() => {
    // we want a fresh instance for each test, since some of them will mutate it
    i18n = prepareUsOzTranslations();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15));
    // dates in this fixture are relative to system time,
    // so it should be created after the clock is mocked
    sentenceDatesFixture = getSentenceDatesFixtureData();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("copy", () => {
    beforeEach(async () => {
      // The common namespace is loaded lazily via the async backend; explicitly
      // pull it for both languages so translations resolve synchronously in tests.
      // In the real app the useTranslation hook manages this with promises and Suspense
      await i18n.reloadResources(["en", "es"], ["common"]);
    });

    describe("English", () => {
      beforeEach(() => {
        t = i18n.getFixedT("en", ["US_OZ", "common"]);
      });

      it("returns the correct copy", () => {
        const presenter = new SentenceDatesPresenter(sentenceDatesFixture, t);

        expect(presenter.sectionHeadingText).toMatchInlineSnapshot(
          `"Important dates"`,
        );
      });

      it("can override values from the common translation resource", () => {
        i18n.addResourceBundle(
          "en",
          "US_OZ",
          copyFixtureEnglishWithCustomHeading,
        );

        const presenter = new SentenceDatesPresenter(sentenceDatesFixture, t);

        expect(presenter.sectionHeadingText).toBe(
          copyFixtureEnglishWithCustomHeading.sentenceDates.general?.heading,
        );
      });
    });

    describe("Spanish", () => {
      beforeEach(() => {
        t = i18n.getFixedT("es", ["US_OZ", "common"]);
      });

      it("returns the correct copy", () => {
        const presenter = new SentenceDatesPresenter(sentenceDatesFixture, t);

        expect(presenter.sectionHeadingText).toMatchInlineSnapshot(
          `"Fechas importantes"`,
        );
      });
    });
  });

  describe("data validation", () => {
    beforeEach(() => {
      t = i18n.getFixedT("en", ["US_OZ", "common"]);
    });

    it("returns a date presenter for each valid date in order", () => {
      const presenter = new SentenceDatesPresenter(sentenceDatesFixture, t);

      expect(presenter.datePresenters.map((dp) => dp.id)).toEqual(
        sentenceDatesFixture.dates.map((d) => d.id),
      );
    });

    it("returns all dates unchanged when fixture data matches copy", () => {
      const {
        data: { dates },
      } = new SentenceDatesPresenter(sentenceDatesFixture, t);

      expect(dates).toEqual(sentenceDatesFixture.dates);
    });

    it("throws if a date in the copy is missing from the data", () => {
      expect(
        () =>
          new SentenceDatesPresenter(
            { dates: sentenceDatesFixture.dates.slice(1) },
            t,
          ),
      ).toThrow(
        "Expected sentence dates are missing from data: parole_eligibility_date",
      );
    });

    it("filters out dates that have no corresponding copy", () => {
      const {
        data: { dates },
      } = new SentenceDatesPresenter(
        {
          dates: [
            ...sentenceDatesFixture.dates,
            { id: "unknown_date", date: new Date("2030-01-01") },
          ],
        },
        t,
      );

      expect(dates).toEqual(sentenceDatesFixture.dates);
    });

    it("does not filter out a date if only the Spanish translation is missing", () => {
      const { max_discharge_date, ...datesWithoutMaxDischarge } =
        copyFixtureSpanish.sentenceDates.dates;

      // sanity check since the object keys are weakly typed
      expect(max_discharge_date).toBeDefined();

      i18n = prepareUsOzTranslations({
        spanishCopy: {
          sentenceDates: {
            ...copyFixtureSpanish.sentenceDates,
            dates: datesWithoutMaxDischarge,
          },
        },
      });
      t = i18n.getFixedT("en", ["US_OZ", "common"]);

      const {
        data: { dates },
      } = new SentenceDatesPresenter(sentenceDatesFixture, t);

      expect(dates).toEqual(sentenceDatesFixture.dates);
    });
  });
});
