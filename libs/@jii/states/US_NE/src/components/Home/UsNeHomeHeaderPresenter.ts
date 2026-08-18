// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { isNumber } from "lodash";
import { makeAutoObservable } from "mobx";

import { UsNeTFunction } from "~@jii/translation";
import type { UsNeResidentMetadata } from "~datatypes";

const headerFields = [
  { key: "numHoldsAndDetainers", fields: ["numHoldsAndDetainers"] },
  { key: "numNotifiers", fields: ["numNotifiers"] },
  { key: "deadTime", fields: ["deadTimeDays"] },
  {
    key: "mandatoryMinimumSentence",
    fields: [
      "mandatoryMinimumSentenceYears",
      "mandatoryMinimumSentenceMonths",
      "mandatoryMinimumSentenceDays",
    ],
  },
  {
    key: "minimumSentence",
    fields: [
      "minimumSentenceYears",
      "minimumSentenceMonths",
      "minimumSentenceDays",
    ],
  },
  {
    key: "maximumSentence",
    fields: [
      "maximumSentenceYears",
      "maximumSentenceMonths",
      "maximumSentenceDays",
    ],
  },
  { key: "goodTime", fields: ["goodTimeLawNumber"] },
] as const satisfies {
  key: string;
  fields: Array<keyof UsNeResidentMetadata>;
}[];

export class UsNeHomeHeaderPresenter {
  constructor(
    private stateSpecificData: UsNeResidentMetadata,
    private t: UsNeTFunction,
  ) {
    makeAutoObservable(this);
  }

  get pageTitle(): string {
    return this.t(($) => $.home.pageTitle);
  }

  get headerText(): Array<{ label: string; content: string }> {
    return headerFields.flatMap(({ key, fields }) => {
      const visibleFields = fields.filter(
        (field) => this.stateSpecificData[field] !== null,
      );

      if (visibleFields.length === 0) {
        return [];
      }

      const contentParts = visibleFields.map((field) =>
        this.t(($) => $.home.headerFields.formatters[field].value, {
          ...this.stateSpecificData,
          count: isNumber(this.stateSpecificData[field])
            ? this.stateSpecificData[field]
            : undefined,
        }),
      );

      return [
        {
          label: this.t(($) => $.home.headerFields.labels[key]),
          content: contentParts.join(", "),
        },
      ];
    });
  }
}
