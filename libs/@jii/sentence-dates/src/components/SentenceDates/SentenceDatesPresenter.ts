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

import { SentenceDatesData } from "../../data/types";
import { defaultComponents } from "../defaultComponents";
import { DatePresenter } from "./DatePresenter";
import { SentenceDatesComponents, TFn } from "./types";

export class SentenceDatesPresenter {
  data: SentenceDatesData;

  constructor(
    private inputData: SentenceDatesData,
    private t: TFn,
    private componentOverrides?: Partial<SentenceDatesComponents>,
  ) {
    this.data = {
      ...inputData,
      dates: this.getValidatedDatesData(),
    };
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

  /**
   * The final set of descendant components to be composed by the main SentenceDates component,
   * consisting of default components plus any overrides that may have been passed in
   */
  get components(): SentenceDatesComponents {
    return { ...defaultComponents, ...this.componentOverrides };
  }

  get datePresenters() {
    return this.data.dates.map((d) => new DatePresenter(d, this.t));
  }

  get sectionHeadingText() {
    return this.t(($) => $.sentenceDates.general.heading);
  }
}
