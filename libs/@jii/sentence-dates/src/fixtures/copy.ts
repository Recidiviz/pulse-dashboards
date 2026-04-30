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

import { cloneDeep } from "lodash";

import {
  createI18nInstance,
  StateSentenceDatesResources,
} from "~@jii/translation";

export const copyFixtureEnglish: StateSentenceDatesResources = {
  sentenceDates: {
    dates: {
      parole_eligibility_date: {
        label: "Parole Eligibility Date",
        description:
          "The earliest date you are eligible to be considered for release on parole.",
      },
      max_discharge_date: {
        label: "Maximum Discharge Date",
        description:
          "The latest date by which you must be released, representing the full length of your sentence.",
      },
    },
  },
};

export const copyFixtureEnglishWithoutDescriptions =
  cloneDeep(copyFixtureEnglish);
delete copyFixtureEnglishWithoutDescriptions.sentenceDates.dates[
  "parole_eligibility_date"
].description;
delete copyFixtureEnglishWithoutDescriptions.sentenceDates.dates[
  "max_discharge_date"
].description;

export const copyFixtureEnglishWithAdjustedDate = cloneDeep(copyFixtureEnglish);
copyFixtureEnglishWithAdjustedDate.sentenceDates.dates[
  "max_discharge_date"
].adjusted = {
  originalDateLabel: "Original Max Date",
  adjustedDateLabel: "Adjusted Max Date",
};

export const copyFixtureEnglishWithCustomHeading: StateSentenceDatesResources =
  {
    sentenceDates: {
      ...copyFixtureEnglish.sentenceDates,
      general: { heading: "Your possible release dates" },
    },
  };

// These are just machine translations for testing purposes, may contain inaccuracies
export const copyFixtureSpanish: StateSentenceDatesResources = {
  sentenceDates: {
    dates: {
      parole_eligibility_date: {
        label: "Fecha de Elegibilidad para la Libertad Condicional",
        description:
          "La fecha más temprana en que puede ser considerado para su liberación bajo libertad condicional.",
      },
      max_discharge_date: {
        label: "Fecha Máxima de Liberación",
        description:
          "La fecha límite en la que debe ser liberado, que representa la duración total de su sentencia.",
      },
    },
  },
};

export const copyFixtureSpanishWithoutDescriptions =
  cloneDeep(copyFixtureSpanish);
delete copyFixtureSpanishWithoutDescriptions.sentenceDates.dates[
  "parole_eligibility_date"
].description;
delete copyFixtureSpanishWithoutDescriptions.sentenceDates.dates[
  "max_discharge_date"
].description;

export const copyFixtureSpanishWithAdjustedDate = cloneDeep(copyFixtureSpanish);
copyFixtureSpanishWithAdjustedDate.sentenceDates.dates[
  "max_discharge_date"
].adjusted = {
  originalDateLabel: "Fecha Máxima Original",
  adjustedDateLabel: "Fecha Máxima Ajustada",
};

export const copyFixtureSpanishWithCustomHeading: StateSentenceDatesResources =
  {
    sentenceDates: {
      ...copyFixtureSpanish.sentenceDates,
      general: { heading: "Sus posibles fechas de liberación" },
    },
  };

export type TranslationsFixture = {
  englishCopy?: StateSentenceDatesResources;
  spanishCopy?: Partial<StateSentenceDatesResources>;
};

export function prepareUsOzTranslations({
  englishCopy = copyFixtureEnglish,
  spanishCopy = copyFixtureSpanish,
}: TranslationsFixture = {}) {
  const i = createI18nInstance(["es"]);
  i.addResourceBundle("en", "US_OZ", englishCopy);
  i.addResourceBundle("es", "US_OZ", spanishCopy);
  return i;
}
