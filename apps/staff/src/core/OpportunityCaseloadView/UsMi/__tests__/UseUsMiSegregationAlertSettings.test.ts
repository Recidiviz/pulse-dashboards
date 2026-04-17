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

import { UsMiSolitarySessionType } from "~datatypes";

import {
  AD_SEG_ALERT_THRESHOLD,
  AD_SEG_INFO_THRESHOLD,
  AD_SEG_WARNING_THRESHOLD,
  TEMP_SEG_ALERT_THRESHOLD,
  TEMP_SEG_WARNING_THRESHOLD,
  useUsMiSegregationAlertSettings,
} from "../UsMiSegDurationCell";

let solitarySessionType: UsMiSolitarySessionType;
let numDaysInSolitary: number;

describe("Ad Seg", () => {
  beforeEach(() => {
    solitarySessionType = "Administrative Segregation";
  });

  it("returns undefined when num days does not reach threshold", () => {
    numDaysInSolitary = AD_SEG_INFO_THRESHOLD - 1;
    expect(
      useUsMiSegregationAlertSettings(numDaysInSolitary, solitarySessionType),
    ).toBeUndefined();
  });

  it("returns info settings when info threshold is reached", () => {
    numDaysInSolitary = AD_SEG_INFO_THRESHOLD;
    expect(
      useUsMiSegregationAlertSettings(numDaysInSolitary, solitarySessionType),
    ).toEqual({
      tooltip: "Approaching 6 Months in Ad Seg",
      palette: "YELLOW",
    });
  });

  it("returns warning settings when warning threshold is reached", () => {
    numDaysInSolitary = AD_SEG_WARNING_THRESHOLD;
    expect(
      useUsMiSegregationAlertSettings(numDaysInSolitary, solitarySessionType),
    ).toEqual({
      tooltip: "Approaching 12 Months in Ad Seg",
      palette: "ORANGE",
    });
  });

  it("returns alert settings when alert threshold is reached", () => {
    numDaysInSolitary = AD_SEG_ALERT_THRESHOLD;
    expect(
      useUsMiSegregationAlertSettings(numDaysInSolitary, solitarySessionType),
    ).toEqual({
      tooltip: "Has Spent 12+ Months in Ad Seg",
      palette: "RED",
    });
  });
});

describe("Temp Seg", () => {
  beforeEach(() => {
    solitarySessionType = "Temporary Segregation";
  });

  it("returns undefined when num days does not reach threshold", () => {
    numDaysInSolitary = TEMP_SEG_WARNING_THRESHOLD - 1;
    expect(
      useUsMiSegregationAlertSettings(numDaysInSolitary, solitarySessionType),
    ).toBeUndefined();
  });

  it("returns warning settings when warning threshold is reached", () => {
    numDaysInSolitary = TEMP_SEG_WARNING_THRESHOLD;
    expect(
      useUsMiSegregationAlertSettings(numDaysInSolitary, solitarySessionType),
    ).toEqual({
      tooltip: "Approaching 30 Day Maximum in Temp Seg",
      palette: "ORANGE",
    });
  });

  it("returns alert settings when alert threshold is reached", () => {
    numDaysInSolitary = TEMP_SEG_ALERT_THRESHOLD;
    expect(
      useUsMiSegregationAlertSettings(numDaysInSolitary, solitarySessionType),
    ).toEqual({
      tooltip: "Has Spent 30+ Days in Temp Seg",
      palette: "RED",
    });
  });
});
