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

import { createI18nInstance } from "~@jii/translation";
import { UsNeResidentMetadata, usNeResidents } from "~datatypes";

import { UsNeHomeHeaderPresenter } from "./UsNeHomeHeaderPresenter";

// The contents of the copy here don't matter, only the paths, which are used
// to test the presenter filtering/copy composition logic.
const usNeResourceFixture = {
  home: {
    headerFields: {
      labels: {
        numHoldsAndDetainers: "Open Detainers/Holds:",
        numNotifiers: "Open Notifiers:",
        deadTime: "Dead Time:",
        minimumSentence: "Minimum Sentence:",
        maximumSentence: "Maximum Sentence:",
        goodTime: "Good Time Law:",
      },
      formatters: {
        numHoldsAndDetainers: {
          value: "{{count, number}}",
        },
        numNotifiers: {
          value: "{{count, number}}",
        },
        deadTimeDays: {
          value_one: "{{count, number}} Day",
          value_other: "{{count, number}} Days",
        },
        minimumSentenceYears: {
          value_one: "{{count, number}} Yr",
          value_other: "{{count, number}} Yrs",
        },
        minimumSentenceMonths: {
          value_one: "{{count, number}} Month",
          value_other: "{{count, number}} Months",
        },
        minimumSentenceDays: {
          value_one: "{{count, number}} Day",
          value_other: "{{count, number}} Days",
        },
        maximumSentenceYears: {
          value_one: "{{count, number}} Yr",
          value_other: "{{count, number}} Yrs",
        },
        maximumSentenceMonths: {
          value_one: "{{count, number}} Month",
          value_other: "{{count, number}} Months",
        },
        maximumSentenceDays: {
          value_one: "{{count, number}} Day",
          value_other: "{{count, number}} Days",
        },
        goodTimeLawNumber: {
          value: "LB {{goodTimeLawNumber}}",
        },
      },
    },
  },
};

const baseData = usNeResidents[0].metadata as UsNeResidentMetadata;

const i18n = createI18nInstance([]);
i18n.addResourceBundle("en", "US_NE", usNeResourceFixture);
const t = i18n.getFixedT("en", "US_NE");

function createPresenter(stateSpecificData: UsNeResidentMetadata) {
  return new UsNeHomeHeaderPresenter(stateSpecificData, t);
}

describe("headerText", () => {
  it("has a value for each relevant header field", () => {
    const presenter = createPresenter(baseData);
    expect(presenter.headerText).toHaveLength(7);
  });

  it("filters out null values", () => {
    const dataWithNulls = {
      ...baseData,
      numHoldsAndDetainers: 0,
      numNotifiers: 0,
      deadTimeDays: null,
      minimumSentenceYears: null,
      minimumSentenceMonths: null,
      minimumSentenceDays: null,
      maximumSentenceYears: null,
      maximumSentenceMonths: null,
      maximumSentenceDays: null,
      goodTimeLawNumber: null,
    };

    const presenter = createPresenter(dataWithNulls);

    expect(presenter.headerText).toHaveLength(3);
  });

  describe("minimumSentence/maximumSentence", () => {
    it("formats years, months, and days", () => {
      const presenter = createPresenter({
        ...baseData,
        minimumSentenceYears: 1,
        minimumSentenceMonths: 2,
        minimumSentenceDays: 3,
        maximumSentenceYears: 4,
        maximumSentenceMonths: 5,
        maximumSentenceDays: 6,
      });

      const contents = presenter.headerText.map(({ content }) => content);
      expect(contents).toContain("1 Yr, 2 Months, 3 Days");
      expect(contents).toContain("4 Yrs, 5 Months, 6 Days");
    });

    it("formats years and months", () => {
      const presenter = createPresenter({
        ...baseData,
        minimumSentenceYears: 1,
        minimumSentenceMonths: 2,
        minimumSentenceDays: null,
        maximumSentenceYears: 4,
        maximumSentenceMonths: 5,
        maximumSentenceDays: null,
      });

      const contents = presenter.headerText.map(({ content }) => content);
      expect(contents).toContain("1 Yr, 2 Months");
      expect(contents).toContain("4 Yrs, 5 Months");
    });

    it("formats years and days", () => {
      const presenter = createPresenter({
        ...baseData,
        minimumSentenceYears: 1,
        minimumSentenceMonths: null,
        minimumSentenceDays: 3,
        maximumSentenceYears: 4,
        maximumSentenceMonths: null,
        maximumSentenceDays: 6,
      });

      const contents = presenter.headerText.map(({ content }) => content);
      expect(contents).toContain("1 Yr, 3 Days");
      expect(contents).toContain("4 Yrs, 6 Days");
    });

    it("formats months and days", () => {
      const presenter = createPresenter({
        ...baseData,
        minimumSentenceYears: null,
        minimumSentenceMonths: 2,
        minimumSentenceDays: 3,
        maximumSentenceYears: null,
        maximumSentenceMonths: 5,
        maximumSentenceDays: 6,
      });

      const contents = presenter.headerText.map(({ content }) => content);
      expect(contents).toContain("2 Months, 3 Days");
      expect(contents).toContain("5 Months, 6 Days");
    });

    it("formats years only", () => {
      const presenter = createPresenter({
        ...baseData,
        minimumSentenceYears: 1,
        minimumSentenceMonths: null,
        minimumSentenceDays: null,
        maximumSentenceYears: 4,
        maximumSentenceMonths: null,
        maximumSentenceDays: null,
      });

      const contents = presenter.headerText.map(({ content }) => content);
      expect(contents).toContain("1 Yr");
      expect(contents).toContain("4 Yrs");
    });

    it("formats months only", () => {
      const presenter = createPresenter({
        ...baseData,
        minimumSentenceYears: null,
        minimumSentenceMonths: 2,
        minimumSentenceDays: null,
        maximumSentenceYears: null,
        maximumSentenceMonths: 5,
        maximumSentenceDays: null,
      });

      const contents = presenter.headerText.map(({ content }) => content);
      expect(contents).toContain("2 Months");
      expect(contents).toContain("5 Months");
    });

    it("formats days only", () => {
      const presenter = createPresenter({
        ...baseData,
        minimumSentenceYears: null,
        minimumSentenceMonths: null,
        minimumSentenceDays: 3,
        maximumSentenceYears: null,
        maximumSentenceMonths: null,
        maximumSentenceDays: 6,
      });

      const contents = presenter.headerText.map(({ content }) => content);
      expect(contents).toContain("3 Days");
      expect(contents).toContain("6 Days");
    });
  });
});
