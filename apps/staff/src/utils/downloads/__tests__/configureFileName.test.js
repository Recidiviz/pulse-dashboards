// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import configureFilename from "../configureFileName";
import getTimeStamp from "../getTimeStamp";

vi.mock("../getTimeStamp");

describe("configureFilename tests", () => {
  const mockChartId = "revocationsChart";
  const mockMetricType = "some_metric_type";
  const mockMetricPeriodMonths = "some_metric_period";
  const mockSupervisionType = "some_supervision_type";
  const mockDistrict = "some_district";
  const mockFilters = {
    metricType: mockMetricType,
    metricPeriodMonths: mockMetricPeriodMonths,
    supervisionType: mockSupervisionType,
    district: mockDistrict,
  };

  const mockTimeStamp = "19.11.2020";

  beforeEach(() => {
    getTimeStamp.mockReturnValue(mockTimeStamp);
  });

  it("should return filename with timestamp", () => {
    const actual = configureFilename(mockChartId, {}, true);
    expect(actual).toBe(`${mockChartId}-${mockTimeStamp}`);
  });

  it("should return filename with filters", () => {
    const actual = configureFilename(mockChartId, mockFilters, false);

    expect(actual).toBe(
      `${mockChartId}-${mockTimeStamp}-${mockMetricType}-${mockMetricPeriodMonths}-${mockSupervisionType}-${mockDistrict}`,
    );
  });
});
