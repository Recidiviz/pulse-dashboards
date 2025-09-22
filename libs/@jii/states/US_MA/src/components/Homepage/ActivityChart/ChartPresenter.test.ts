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

import { UsMaResidentMetadata, usMaResidents } from "~datatypes";

import { usMaEgtConfig } from "../../../configs/US_MA/egtConfig";
import { populateUsMaEGTMonthlyReport } from "../../../models/UsMaEGTMonthlyReport";
import { ChartPresenter } from "./ChartPresenter";

test("chart data", () => {
  const testReports = populateUsMaEGTMonthlyReport(
    usMaResidents[0].metadata as UsMaResidentMetadata,
    usMaEgtConfig,
  );
  const presenter = new ChartPresenter(testReports);

  expect(presenter.chartData).toMatchInlineSnapshot(`
    [
      {
        "creditMonth": 2021-08-16T00:00:00.000Z,
        "creditType": "EARNEDGoodTime",
        "totalCredits": 15,
      },
      {
        "creditMonth": 2021-08-16T00:00:00.000Z,
        "creditType": "BOOST",
        "totalCredits": 0,
      },
      {
        "creditMonth": 2021-08-16T00:00:00.000Z,
        "creditType": "COMPLETION",
        "totalCredits": 0,
      },
      {
        "creditMonth": 2021-09-16T00:00:00.000Z,
        "creditType": "EARNEDGoodTime",
        "totalCredits": 15,
      },
      {
        "creditMonth": 2021-09-16T00:00:00.000Z,
        "creditType": "BOOST",
        "totalCredits": 0,
      },
      {
        "creditMonth": 2021-09-16T00:00:00.000Z,
        "creditType": "COMPLETION",
        "totalCredits": 0,
      },
      {
        "creditMonth": 2021-10-16T00:00:00.000Z,
        "creditType": "EARNEDGoodTime",
        "totalCredits": 15,
      },
      {
        "creditMonth": 2021-10-16T00:00:00.000Z,
        "creditType": "BOOST",
        "totalCredits": 10,
      },
      {
        "creditMonth": 2021-10-16T00:00:00.000Z,
        "creditType": "COMPLETION",
        "totalCredits": 30,
      },
    ]
  `);
});

test("calculated axis ticks", () => {
  let presenter = new ChartPresenter(
    populateUsMaEGTMonthlyReport(
      usMaResidents[0].metadata as UsMaResidentMetadata,
      usMaEgtConfig,
    ),
  );

  // for larger ranges we don't override the chart library's best effort
  expect(presenter.axisTicks).toBeUndefined();

  presenter = new ChartPresenter(
    populateUsMaEGTMonthlyReport(
      usMaResidents[2].metadata as UsMaResidentMetadata,
      usMaEgtConfig,
    ),
  );

  // for smaller ranges we ensure nice multiples of five
  expect(presenter.axisTicks).toMatchInlineSnapshot(`
    [
      0,
      5,
      10,
    ]
  `);
});
