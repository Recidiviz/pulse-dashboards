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

import {
  creditActivityFixture,
  creditActivitySchema,
  creditDateString,
  makeRecordFixture,
  outputFixtureArray,
} from "~datatypes";

import { UsMaEGTMonthlyReport } from "./UsMaEGTMonthlyReport";

const creditDateStr = creditDateString({ months: -2 });
let report: UsMaEGTMonthlyReport;

describe("credit reducers", () => {
  beforeEach(() => {
    const parsedCreditActivity = outputFixtureArray(
      creditActivityFixture
        .filter((creditRecord) => creditRecord.creditDate === creditDateStr)
        .map((credit) => makeRecordFixture(creditActivitySchema, credit)),
    );

    report = new UsMaEGTMonthlyReport(
      new Date(creditDateStr),
      parsedCreditActivity,
    );
  });

  test.each([
    {
      type: "EARNEDGoodTime",
      getter: () => report.totalEGTCreditDays,
      expected: 15,
    },
    { type: "BOOST", getter: () => report.totalBoostCreditDays, expected: 10 },
    {
      type: "COMPLETION",
      getter: () => report.totalCompletionCreditDays,
      expected: 30,
    },
  ])("credit total for $type", ({ type, getter, expected }) => {
    expect(getter()).toBe(expected);
  });
});
