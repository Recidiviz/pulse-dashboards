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

import {
  createI18nInstance,
  StateSentenceDatesResources,
} from "~@jii/translation";

export const copyFixtureEnglish: StateSentenceDatesResources = {
  sentenceDates: {
    dates: {
      projected_release_date: {
        label: "Projected Release (PR)",
        description:
          "The estimated date you will be released from incarceration based on your sentence and time served.",
      },
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

// These are just machine translations for testing purposes, may contain inaccuracies
export const copyFixtureSpanish: StateSentenceDatesResources = {
  sentenceDates: {
    dates: {
      projected_release_date: {
        label: "Liberación Proyectada (LP)",
        description:
          "La fecha estimada en que será liberado de la encarcelación según su sentencia y el tiempo cumplido.",
      },
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

export function prepareUsOzTranslations({
  englishCopy = copyFixtureEnglish,
  spanishCopy = copyFixtureSpanish,
}: {
  englishCopy?: StateSentenceDatesResources;
  spanishCopy?: Partial<StateSentenceDatesResources>;
} = {}) {
  const i = createI18nInstance(["es"]);
  i.addResourceBundle("en", "US_OZ", englishCopy);
  i.addResourceBundle("es", "US_OZ", spanishCopy);
  return i;
}
