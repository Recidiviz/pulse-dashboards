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

import { paroleCasesFixtureByState } from "./fixture";
import { PAROLE_RISK_TOOL, ParoleRiskTool } from "./schema";

describe("Anderson's (DOC-45821) risk overview history", () => {
  const { riskOverviewHistory } = paroleCasesFixtureByState.US_CO["DOC-45821"];
  const dates = riskOverviewHistory.map((point) => point.date);
  const earliestDate = dates[0];
  const latestDate = dates[dates.length - 1];

  const toolsPresentOn = (date: string): Array<ParoleRiskTool> =>
    PAROLE_RISK_TOOL.options.filter((tool) =>
      riskOverviewHistory.some(
        (point) => point.date === date && point[tool] !== undefined,
      ),
    );

  it("gives every tool a value on the earliest date, so their trajectory lines share a common start", () => {
    expect(toolsPresentOn(earliestDate).sort()).toEqual(
      [...PAROLE_RISK_TOOL.options].sort(),
    );
  });

  it("extends LSI and PIT and CARAS to the latest date, so their lines span the full chart", () => {
    expect(toolsPresentOn(latestDate).sort()).toEqual(
      ["CARAS", "LSI", "PIT"].sort(),
    );
  });

  it("deliberately stops SRT's line before the latest date, to demonstrate a stale (12+ month) assessment", () => {
    expect(toolsPresentOn(latestDate)).not.toContain("SRT");

    const srtDates = riskOverviewHistory
      .filter((point) => point.SRT !== undefined)
      .map((point) => point.date);
    expect(srtDates[srtDates.length - 1]).not.toEqual(latestDate);
  });
});
