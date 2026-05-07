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

import { startOfDay } from "date-fns";
import { z } from "zod";

import { dateDistanceTranslation } from "~@jii/translation";

import { SentenceDate } from "../../data/types";
import { TFn } from "./types";
import { getDateCopy } from "./utils";

export const dateCardModifierClassesEnum = z.enum([
  "DateCard--is-upcoming",
  "DateCard--is-past",
]);
export type DateCardModifierClass = z.infer<typeof dateCardModifierClassesEnum>;

export class DatePresenter {
  private translatedCopy: ReturnType<typeof this.processTranslations>;

  constructor(
    public data: SentenceDate,
    public t: TFn,
  ) {
    this.translatedCopy = this.processTranslations();
  }

  private processTranslations() {
    const { t, data } = this;

    const { label, description } = getDateCopy(t, data.id);

    return {
      label,
      description,
      dateFormatted: t(
        ($) =>
          data.date
            ? $.sentenceDates.dateFormats.dateFormatted
            : $.sentenceDates.dateFormats.missingDateMessage,
        {
          date: data.date,
        },
      ),
      dateRelative: data.date
        ? (dateDistanceTranslation(
            data.date,
            // @ts-expect-error the fallback to common namespace will satisfy this usage
            t,
          ) as string)
        : undefined,
    };
  }

  private get today() {
    return startOfDay(new Date());
  }

  /**
   * "Upcoming" here specifically means it's within the next 31 days (inclusive of today)
   */
  private get isUpcomingDate() {
    const { today } = this;

    const thirtyOneDaysFromNow = new Date(today);
    thirtyOneDaysFromNow.setDate(today.getDate() + 31);

    const { date } = this.data;

    return !!date && date >= today && date <= thirtyOneDaysFromNow;
  }

  private get isPastDate(): boolean {
    const { date } = this.data;
    return !!date && date < this.today;
  }

  get id() {
    return this.data.id;
  }

  get cardLabelText() {
    return this.translatedCopy.label;
  }

  /**
   * The value text comprises two related pieces of copy, one "primary" and one "supplemental".
   * These will be filled with two different bits of information — the formatted date
   * and its relative distance from today — which will switch places with each other
   * based on whether the date is upcoming.
   */
  get cardValueText() {
    return this.isUpcomingDate
      ? // special case for dates we have flagged as "upcoming" (near future)
        {
          primary: this.translatedCopy.dateRelative,
          supplemental: this.translatedCopy.dateFormatted,
        }
      : // the normal case for any other future or past dates
        {
          primary: this.translatedCopy.dateFormatted,
          // note an extra bit of behavior: use parentheses in this spot only.
          // universal enough that we don't need to run it through translation for now
          supplemental:
            this.translatedCopy.dateRelative &&
            `(${this.translatedCopy.dateRelative})`,
        };
  }

  get cardDescriptionText() {
    return this.translatedCopy.description;
  }

  get cardModifierClasses(): Array<DateCardModifierClass> {
    const classes: Array<DateCardModifierClass> = [];

    if (this.isUpcomingDate) {
      classes.push("DateCard--is-upcoming");
    }
    if (this.isPastDate) {
      classes.push("DateCard--is-past");
    }

    return classes;
  }
}
