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

import { createSubset } from "../../filters";
import { fetchAndFilterNewRevocationFile } from "..";
import { fetchMetrics } from "../fetchMetrics";

vi.mock("../../core/fetchMetrics", () => {
  return {
    fetchMetrics: vi.fn(),
  };
});
vi.mock("../../filters", () => {
  return {
    createSubset: vi.fn(),
  };
});

const mockMetricFiles = { file_1: "content_1" };
beforeEach(() => {
  vi.mocked(fetchMetrics).mockResolvedValue(mockMetricFiles);
});

describe("fetchAndFilterNewRevocationFile", () => {
  const metricName = "file_1";
  const metricType = "newRevocationFile";
  const filters = {
    violation_type: [
      "all",
      "elec_monitoring",
      "escaped",
      "low_tech",
      "med_tech",
      "municipal",
      "no_violation_type",
      "technical",
    ],
  };
  const isOfflineMode = false;
  const stateCode = "TEST_ID";
  const fetchArgs = { stateCode, metricType, isOfflineMode };

  afterAll(() => {
    vi.resetModules();
  });

  beforeEach(() => {
    fetchAndFilterNewRevocationFile({
      metricName,
      filters,
      ...fetchArgs,
    });
  });

  it("calls fetchMetrics with the correct args", () => {
    expect(fetchMetrics).toHaveBeenCalledWith(
      stateCode,
      metricType,
      metricName,
      isOfflineMode,
    );
    expect.hasAssertions();
  });

  it("calls createSubset with the correct args", () => {
    expect(createSubset).toHaveBeenCalledWith(
      metricName,
      filters,
      mockMetricFiles,
    );
    expect.hasAssertions();
  });
});
