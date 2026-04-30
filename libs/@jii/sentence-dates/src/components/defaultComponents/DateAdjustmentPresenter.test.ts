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

import { addDays, startOfDay } from "date-fns";
import { TFunction } from "i18next";

import {
  copyFixtureEnglish,
  copyFixtureEnglishWithAdjustedDate,
  prepareUsOzTranslations,
} from "../../fixtures/copy";
import {
  DateGenerator,
  getDatesWithOriginal,
  getDefaultDates,
  getSentenceDatesFixtureData,
} from "../../fixtures/data";
import { StateCodeWithSentenceDates, TFn } from "../SentenceDates/types";
import { DateAdjustmentPresenter } from "./DateAdjustmentPresenter";

describe("DateAdjustmentPresenter", () => {
  let t: TFunction<[StateCodeWithSentenceDates, "common"]>;
  let presenter: DateAdjustmentPresenter;

  function getPresenter(datesFn: DateGenerator) {
    const { dates } = getSentenceDatesFixtureData(datesFn);
    return new DateAdjustmentPresenter(dates[1], t as TFn);
  }

  beforeEach(async () => {
    const i18n = prepareUsOzTranslations({
      englishCopy: copyFixtureEnglishWithAdjustedDate,
    });
    await i18n.reloadResources(["en"], ["common"]);
    t = i18n.getFixedT("en", ["US_OZ", "common"]);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has text for the original date and adjustment", () => {
    presenter = getPresenter(getDatesWithOriginal);
    expect(presenter.text).toMatchInlineSnapshot(`
      {
        "adjusted": {
          "label": "Adjusted Max Date",
          "value": "May 20, 2027",
        },
        "original": {
          "label": "Original Max Date",
          "value": "January 24, 2031",
        },
        "reduction": {
          "label": "Total reduction",
          "value": "-1,345 days",
        },
      }
    `);
  });

  it("does not have text when there is no originalDate", () => {
    presenter = getPresenter(getDefaultDates);
    expect(presenter.text).toBeUndefined();
  });

  it("does not have text when there is no copy configured", async () => {
    const i18n = prepareUsOzTranslations({
      englishCopy: copyFixtureEnglish,
    });
    await i18n.reloadResources(["en"], ["common"]);
    t = i18n.getFixedT("en", ["US_OZ", "common"]);

    presenter = getPresenter(getDatesWithOriginal);
    expect(presenter.text).toBeUndefined();
  });

  it("does not have text if originalDate is not later than the adjusted date", () => {
    presenter = getPresenter(() => {
      const dates = getDatesWithOriginal();
      dates[1].originalDate = startOfDay(addDays(dates[1].date as Date, -14));
      return dates;
    });

    expect(presenter.text).toBeUndefined();
  });
});
