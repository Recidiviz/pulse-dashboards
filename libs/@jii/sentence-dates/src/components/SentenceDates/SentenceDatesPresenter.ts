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
import { PickByValue } from "utility-types";

import {
  dateDistanceTranslation,
  I18nResources,
  StateSentenceDatesResources,
} from "~@jii/translation";

import { SentenceDatesData } from "../../data/types";

export type StateCodeWithSentenceDates = keyof PickByValue<
  I18nResources,
  StateSentenceDatesResources
>;

type TFn = TFunction<[StateCodeWithSentenceDates, "common"]>;

export class SentenceDatesPresenter {
  copy: ReturnType<typeof this.createCopy>;

  data: SentenceDatesData;

  constructor(
    private inputData: SentenceDatesData,
    private t: TFn,
  ) {
    this.data = {
      ...inputData,
      dates: this.getValidatedDatesData(),
    };
    this.copy = this.createCopy();
  }

  private getValidatedDatesData() {
    const { t, inputData } = this;

    const datesInCopy = Object.keys(
      // we only care about the keys here, so it doesn't matter that the values
      // will be missing input data (e.g. the actual dates)
      t(($) => $.sentenceDates.dates, { returnObjects: true }),
    );
    const datesInData = new Set(inputData.dates.map((d) => d.id));

    // all dates in reference copy MUST be present in the input data
    const datesMissingFromData = datesInCopy.filter((d) => !datesInData.has(d));
    if (datesMissingFromData.length > 0) {
      throw new Error(
        `Expected sentence dates are missing from data: ${datesMissingFromData.join(", ")}`,
      );
    }

    // excess dates in data are not an error but they must be discarded
    // since we can't display them correctly without copy
    return inputData.dates.filter((d) => datesInCopy.includes(d.id));
  }

  private createCopy() {
    const { data, t } = this;

    const dates = data.dates.map((d) => {
      const copy = {
        ...t(($) => $.sentenceDates.dates[d.id], {
          returnObjects: true,
        }),
        dateFormatted: t(
          ($) =>
            d.date
              ? $.sentenceDates.dateFormats.dateFormatted
              : $.sentenceDates.dateFormats.missingDateMessage,
          {
            date: d.date,
          },
        ),
        dateRelative: d.date
          ? (dateDistanceTranslation(
              d.date,
              // @ts-expect-error the fallback to common namespace will satisfy this usage
              t,
            ) as string)
          : undefined,
      };
      return copy;
    });

    const general = t(($) => $.sentenceDates.general, {
      returnObjects: true,
    });

    return { general, dates };
  }
}
