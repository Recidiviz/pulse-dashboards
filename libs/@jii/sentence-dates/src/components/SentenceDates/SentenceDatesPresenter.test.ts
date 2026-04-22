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
  copyFixtureEnglish,
  copyFixtureSpanish,
  prepareUsOzTranslations,
} from "../../fixtures/copy";
import { getSentenceDatesFixtureData } from "../../fixtures/data";
import {
  SentenceDatesPresenter,
  StateCodeWithSentenceDates,
} from "./SentenceDatesPresenter";

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
        const { copy } = new SentenceDatesPresenter(sentenceDatesFixture, t);

        expect(copy).toMatchInlineSnapshot(`
          {
            "dates": [
              {
                "dateFormatted": "April 22, 2026",
                "dateRelative": "7 days from today",
                "description": "The estimated date you will be released from incarceration based on your sentence and time served.",
                "label": "Projected Release (PR)",
              },
              {
                "dateFormatted": "No date on record",
                "dateRelative": undefined,
                "description": "The earliest date you are eligible to be considered for release on parole.",
                "label": "Parole Eligibility Date",
              },
              {
                "dateFormatted": "May 20, 2027",
                "dateRelative": "1 year and 1 month from today",
                "description": "The latest date by which you must be released, representing the full length of your sentence.",
                "label": "Maximum Discharge Date",
              },
            ],
            "general": {
              "heading": "Important dates",
            },
          }
        `);
      });

      it("can override values from the common translation resource", () => {
        const specialHeading = "Special heading for Oz";

        i18n.addResourceBundle("en", "US_OZ", {
          sentenceDates: {
            ...copyFixtureEnglish.sentenceDates,
            general: { heading: specialHeading },
          },
        });

        const { copy } = new SentenceDatesPresenter(sentenceDatesFixture, t);

        expect(copy.general.heading).toBe(specialHeading);
      });
    });

    describe("Spanish", () => {
      beforeEach(() => {
        t = i18n.getFixedT("es", ["US_OZ", "common"]);
      });

      it("returns the correct copy", () => {
        const { copy } = new SentenceDatesPresenter(sentenceDatesFixture, t);

        expect(copy).toMatchInlineSnapshot(`
          {
            "dates": [
              {
                "dateFormatted": "22 de abril de 2026",
                "dateRelative": "Dentro de 7 días",
                "description": "La fecha estimada en que será liberado de la encarcelación según su sentencia y el tiempo cumplido.",
                "label": "Liberación Proyectada (LP)",
              },
              {
                "dateFormatted": "Sin fecha registrada",
                "dateRelative": undefined,
                "description": "La fecha más temprana en que puede ser considerado para su liberación bajo libertad condicional.",
                "label": "Fecha de Elegibilidad para la Libertad Condicional",
              },
              {
                "dateFormatted": "20 de mayo de 2027",
                "dateRelative": "Dentro de 1 año y 1 mes",
                "description": "La fecha límite en la que debe ser liberado, que representa la duración total de su sentencia.",
                "label": "Fecha Máxima de Liberación",
              },
            ],
            "general": {
              "heading": "Fechas importantes",
            },
          }
        `);
      });
    });
  });

  describe("data validation", () => {
    beforeEach(() => {
      t = i18n.getFixedT("en", ["US_OZ", "common"]);
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
        "Expected sentence dates are missing from data: projected_release_date",
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
      const { max_discharge_date: _, ...datesWithoutMaxDischarge } =
        copyFixtureSpanish.sentenceDates.dates;

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
