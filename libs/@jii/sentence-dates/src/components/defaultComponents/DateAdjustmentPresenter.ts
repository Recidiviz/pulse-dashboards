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

import { differenceInCalendarDays } from "date-fns";

import { SentenceDate } from "../../data/types";
import { TFn } from "../SentenceDates/types";
import { getDateCopy } from "../SentenceDates/utils";

export class DateAdjustmentPresenter {
  constructor(
    public data: SentenceDate,
    public t: TFn,
  ) {}

  get text() {
    const {
      data: { date, originalDate, id },
      t,
    } = this;
    if (!originalDate || !date) return;
    // we only support displaying actual reductions so we verify the original is later
    if (date >= originalDate) return;

    const { adjusted } = getDateCopy(t, id);
    // copy also needs to exist
    if (!adjusted) return;

    return {
      original: {
        label: adjusted.originalDateLabel,
        value: t(($) => $.sentenceDates.dateFormats.dateFormatted, {
          date: originalDate,
        }),
      },
      reduction: {
        label: t(($) => $.sentenceDates.general.dateReductionLabel),
        value: t(($) => $.sentenceDates.dateFormats.differenceInDays, {
          // the order of args is important here: when adjusted is earlier
          // we want the resulting difference to be a negative number
          count: differenceInCalendarDays(date, originalDate),
        }),
      },
      adjusted: {
        label: adjusted.adjustedDateLabel,
        value: t(($) => $.sentenceDates.dateFormats.dateFormatted, {
          date,
        }),
      },
    };
  }
}
