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

import * as Sentry from "@sentry/node";

import { fetchMetrics } from "..";
import { fetchMetricsFromGCS } from "../fetchMetricsFromGCS";
import { fetchMetricsFromLocal } from "../fetchMetricsFromLocal";
import { processMetricFile } from "../processMetricFile";

vi.mock("@sentry/node");
vi.mock("../processMetricFile");
vi.mock("../fetchMetricsFromLocal");
vi.mock("../fetchMetricsFromGCS");

describe("fetchMetrics tests", () => {
  const stateCode = "demo_code";
  const upperCasedStateCode = "DEMO_CODE";
  const file = "file";
  const fileKey = "some key";
  const contents = "some file contents";
  const metadata = "some metadata";
  const extension = "some extension";
  const promiseData = {
    contents,
    metadata,
    extension,
    fileKey,
  };
  const deserializedFile = "some deserialized file";

  beforeEach(() => {
    // do not log the expected error - keep tests less verbose
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  it("should successfully return a promise with results of local data", () => {
    const metricType = "metric_type";
    const isDemo = true;
    fetchMetricsFromLocal.mockReturnValue([Promise.resolve(promiseData)]);
    processMetricFile.mockReturnValue(deserializedFile);

    return fetchMetrics(stateCode, metricType, file, isDemo).then((results) => {
      expect(fetchMetricsFromLocal).toHaveBeenCalledTimes(1);
      expect(fetchMetricsFromLocal).toHaveBeenCalledWith(
        upperCasedStateCode,
        metricType,
        file,
      );

      expect(processMetricFile).toHaveBeenCalledTimes(1);
      expect(processMetricFile).toHaveBeenCalledWith(
        contents,
        metadata,
        extension,
      );
      expect(results).toStrictEqual({ [fileKey]: deserializedFile });
    });
  });

  it("should successfully return a promise with results from GCS data", () => {
    const metricType = "metric_type_2";
    const isDemo = false;
    fetchMetricsFromGCS.mockReturnValue([Promise.resolve(promiseData)]);
    processMetricFile.mockReturnValue(deserializedFile);

    return fetchMetrics(stateCode, metricType, file, isDemo).then((results) => {
      expect(fetchMetricsFromGCS).toHaveBeenCalledTimes(1);
      expect(fetchMetricsFromGCS).toHaveBeenCalledWith(
        upperCasedStateCode,
        metricType,
        file,
      );

      expect(processMetricFile).toHaveBeenCalledTimes(1);
      expect(processMetricFile).toHaveBeenCalledWith(
        contents,
        metadata,
        extension,
      );
      expect(results).toStrictEqual({ [fileKey]: deserializedFile });
    });
  });

  it("should process any metric files with a fulfilled promise, even if it followed a rejected promise", () => {
    const metricType = "metric_type_2";
    const isDemo = false;
    const error = new Error("Error");
    fetchMetricsFromGCS.mockReturnValue([
      Promise.reject(error),
      Promise.resolve(promiseData),
    ]);
    processMetricFile.mockReturnValue(deserializedFile);

    return fetchMetrics(stateCode, metricType, file, isDemo).then((results) => {
      expect(fetchMetricsFromGCS).toHaveBeenCalledTimes(1);
      expect(fetchMetricsFromGCS).toHaveBeenCalledWith(
        upperCasedStateCode,
        metricType,
        file,
      );

      expect(processMetricFile).toHaveBeenCalledTimes(1);
      expect(processMetricFile).toHaveBeenCalledWith(
        contents,
        metadata,
        extension,
      );
      expect(results).toStrictEqual({ [fileKey]: deserializedFile });
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });
});
